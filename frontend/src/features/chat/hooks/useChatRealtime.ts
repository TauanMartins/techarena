import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { chatMessageFromRow, type ChatMessage } from "../api/message-mapper";
import { otherOnlineParticipantIds } from "./realtime";
import { chatApi } from "../api/chat.api";

type Connection = "idle" | "connecting" | "connected" | "error";
interface RealtimeState {
  client: SupabaseClient | null;
  topic: string | null;
  token: string;
  userId: string;
  displayName: string;
  retryCount: number;
  connection: Connection;
  connectedTopic: string | null;
  error: string | null;
  onlineUserIds: string[];
  presenceSynced: boolean;
}

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
  const [retryCount, setRetryCount] = useState(0);
  const [state, setState] = useState<RealtimeState>({
    client: null, topic: null, token: "", userId: "", displayName: "", retryCount: -1,
    connection: "idle", connectedTopic: null, error: null, onlineUserIds: [], presenceSynced: false,
  });
  const onMessageRef = useRef(onMessage);
  useLayoutEffect(() => { onMessageRef.current = onMessage; }, [onMessage]);
  const isCurrent = state.client === client && state.topic === topic && state.token === token
    && state.userId === userId && state.displayName === displayName && state.retryCount === retryCount;
  const connection = !client || !topic ? "idle" : isCurrent ? state.connection : "connecting";
  const connectedTopic = isCurrent ? state.connectedTopic : null;
  const error = isCurrent ? state.error : null;
  const onlineUserIds = isCurrent ? state.onlineUserIds : [];
  const presenceSynced = isCurrent && state.presenceSynced;

  useEffect(() => {
    if (!client || !topic) return;

    let active = true;
    let cancelSubscribe: (() => void) | null = null;
    const channel = client.channel(`chat:${topic}`, {
      config: { private: true, presence: { key: userId } },
    });
    const updateState = (patch: Partial<RealtimeState>) => setState((current) => {
      const sameIdentity = current.client === client && current.topic === topic && current.token === token
        && current.userId === userId && current.displayName === displayName && current.retryCount === retryCount;
      return {
        client, topic, token, userId, displayName, retryCount,
        connection: sameIdentity ? current.connection : "connecting",
        connectedTopic: sameIdentity ? current.connectedTopic : null,
        error: sameIdentity ? current.error : null,
        onlineUserIds: sameIdentity ? current.onlineUserIds : [],
        presenceSynced: sameIdentity ? current.presenceSynced : false,
        ...patch,
      };
    });

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
        updateState({ onlineUserIds: otherOnlineParticipantIds(channel.presenceState(), userId), presenceSynced: true });
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
              updateState({ connection: "connected", connectedTopic: topic });
              resolve();
            } else if (["CHANNEL_ERROR", "TIMED_OUT", "CLOSED"].includes(status)) {
              cancelSubscribe = null;
              updateState({ connection: "error", connectedTopic: null });
              reject(cause ?? new Error("Não foi possível conectar a esta conversa."));
            }
          });
        });
        if (!active) return;
        const presenceStatus = await channel.track({ userId, name: displayName, onlineAt: new Date().toISOString() });
        if (active && presenceStatus !== "ok") updateState({ error: "Não foi possível atualizar o status de presença." });
      } catch {
        if (!active) return;
        updateState({ connection: "error", connectedTopic: null, error: "Não foi possível abrir esta conversa. Tente novamente." });
      }
    })();

    return () => {
      active = false;
      cancelSubscribe?.();
      void client.removeChannel(channel);
    };
  }, [client, displayName, retryCount, token, topic, userId]);

  const retry = useCallback(() => setRetryCount((count) => count + 1), []);
  return {
    connection,
    connectedTopic,
    error,
    onlineUserIds,
    presenceSynced,
    retry,
    retryCount,
  };
}
