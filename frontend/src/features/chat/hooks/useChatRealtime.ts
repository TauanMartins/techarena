import { useEffect, useRef, useState } from "react";
import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";
import { chatMessageFromRow, type ChatMessage } from "../message-mapper";
import { otherOnlineParticipantIds } from "../realtime";
import { chatApi } from "../api/chat.api";

type Connection = "idle" | "connecting" | "connected" | "error";

export function useChatRealtime({
  client,
  topic,
  token,
  userId,
  displayName,
  onMessage,
}: {
  client: SupabaseClient | null;
  topic: string | null;
  token: string;
  userId: string;
  displayName: string;
  onMessage: (message: ChatMessage) => void;
}) {
  const [connection, setConnection] = useState<Connection>("idle");
  const [connectedTopic, setConnectedTopic] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);
  const [presenceSynced, setPresenceSynced] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  useEffect(() => {
    if (!client || !topic) {
      setConnection("idle");
      setConnectedTopic(null);
      setOnlineUserIds([]);
      setPresenceSynced(false);
      setError(null);
      return;
    }

    let active = true;
    let cancelSubscribe: (() => void) | null = null;
    const channel = client.channel(`chat:${topic}`, {
      config: { private: true, presence: { key: userId } },
    });
    channelRef.current = channel;
    setConnection("connecting");
    setConnectedTopic(null);
    setError(null);
    setOnlineUserIds([]);
    setPresenceSynced(false);

    channel
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "chat_messages",
        filter: `topic=eq.${topic}`,
      }, ({ new: row }) => {
        const message = chatMessageFromRow(row);
        if (active && message) onMessageRef.current(message);
      })
      .on("presence", { event: "sync" }, () => {
        if (!active) return;
        setOnlineUserIds(otherOnlineParticipantIds(channel.presenceState(), userId));
        setPresenceSynced(true);
      });

    void (async () => {
      try {
        await chatApi.ensureAccess(token, topic);
        await client.realtime.setAuth(token);
        if (!active) return;
        await new Promise<void>((resolve, reject) => {
          cancelSubscribe = () => reject(new Error("A conexão da conversa foi cancelada."));
          channel.subscribe((status, cause) => {
            if (!active) return;
            if (status === "SUBSCRIBED") {
              cancelSubscribe = null;
              setConnection("connected");
              setConnectedTopic(topic);
              resolve();
            } else if (["CHANNEL_ERROR", "TIMED_OUT", "CLOSED"].includes(status)) {
              cancelSubscribe = null;
              setConnection("error");
              setConnectedTopic(null);
              reject(cause ?? new Error("Não foi possível conectar a esta conversa."));
            }
          });
        });
        if (!active) return;
        const presenceStatus = await channel.track({ userId, name: displayName, onlineAt: new Date().toISOString() });
        if (active && presenceStatus !== "ok") setError("Não foi possível atualizar o status de presença.");
      } catch {
        if (!active) return;
        setConnection("error");
        setConnectedTopic(null);
        setError("Não foi possível abrir esta conversa. Tente novamente.");
      }
    })();

    return () => {
      active = false;
      cancelSubscribe?.();
      if (channelRef.current === channel) channelRef.current = null;
      void client.removeChannel(channel);
    };
  }, [client, displayName, retryCount, token, topic, userId]);

  return {
    connection,
    connectedTopic,
    error,
    onlineUserIds,
    presenceSynced,
    retry: () => setRetryCount((count) => count + 1),
    retryCount,
    channelRef,
  };
}
