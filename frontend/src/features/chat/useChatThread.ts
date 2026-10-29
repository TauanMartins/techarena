import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import {
  conversationTopic,
  otherOnlineParticipantIds,
} from "./realtime";
import {
  chatMessageFromRow,
  mergeChatMessages,
  type ChatMessage,
} from "./message-mapper";
import type { Conversation } from "./conversations";
import {
  createChatMessage,
  loadLatestMessages,
  loadOlderMessages as fetchOlderMessages,
} from "./message-data";
import { api } from "../../shared/api";
import { supabase } from "../../shared/supabase";

export function useChatThread({
  conversation,
  token,
  userId,
  displayName,
}: {
  conversation: Conversation | undefined;
  token: string;
  userId: string;
  displayName: string;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [hasOlderMessages, setHasOlderMessages] = useState(false);
  const [connection, setConnection] = useState<
    "idle" | "connecting" | "connected" | "error"
  >("idle");
  const [chatError, setChatError] = useState<string | null>(null);
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);
  const [presenceSynced, setPresenceSynced] = useState(false);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageListRef = useRef<HTMLDivElement>(null);
  const previousScrollHeightRef = useRef<number | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const conversationGenerationRef = useRef(0);
  const selectedTopic = useMemo(
    () =>
      conversation
        ? conversationTopic(
            conversation.kind,
            conversation.kind === "direct" ? userId : conversation.id,
            conversation.otherUserId,
          )
        : null,
    [conversation, userId],
  );

  useEffect(() => {
    const generation = ++conversationGenerationRef.current;
    const client = supabase;
    if (!conversation || !selectedTopic || !client) {
      setMessages([]);
      setOnlineUserIds([]);
      setPresenceSynced(false);
      setConnection("idle");
      setChatError(null);
      setHasOlderMessages(false);
      setLoadingHistory(false);
      setSending(false);
      setText("");
      return;
    }

    let active = true;
    let cancelPendingSubscribe: (() => void) | null = null;
    const channel = client.channel(`chat:${selectedTopic}`, {
      config: {
        private: true,
        presence: { key: userId },
      },
    });
    channelRef.current = channel;
    setMessages([]);
    setOnlineUserIds([]);
    setPresenceSynced(false);
    setHasOlderMessages(false);
    setConnection("connecting");
    setChatError(null);
    setLoadingHistory(false);
    setSending(false);
    setText("");

    channel
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `topic=eq.${selectedTopic}`,
        },
        ({ new: row }) => {
          const message = chatMessageFromRow(row);
          if (active && message) {
            setMessages((current) => mergeChatMessages(current, [message]));
          }
        },
      )
      .on("presence", { event: "sync" }, () => {
        if (active) {
          setOnlineUserIds(
            otherOnlineParticipantIds(channel.presenceState(), userId),
          );
          setPresenceSynced(true);
        }
      });

    void (async () => {
      try {
        await api.ensureChatAccess(token, selectedTopic);
        await client.realtime.setAuth(token);
        if (!active) return;

        await new Promise<void>((resolve, reject) => {
          cancelPendingSubscribe = () => {
            reject(new Error("A conexão da conversa foi cancelada."));
          };
          channel.subscribe((status, error) => {
            if (!active) return;
            if (status === "SUBSCRIBED") {
              cancelPendingSubscribe = null;
              setConnection("connected");
              resolve();
            } else if (
              status === "CHANNEL_ERROR" ||
              status === "TIMED_OUT" ||
              status === "CLOSED"
            ) {
              cancelPendingSubscribe = null;
              setConnection("error");
              reject(
                error ??
                  new Error("Não foi possível conectar a esta conversa."),
              );
            }
          });
        });
        if (!active) return;

        const presenceStatus = await channel.track({
          userId,
          name: displayName,
          onlineAt: new Date().toISOString(),
        });
        if (presenceStatus !== "ok") {
          setChatError("Não foi possível atualizar o status de presença.");
        }

        const history = await loadLatestMessages(client, selectedTopic);
        if (!active) return;
        setMessages((current) =>
          mergeChatMessages(current, history.messages),
        );
        setHasOlderMessages(history.hasOlderMessages);
      } catch {
        if (!active) return;
        setConnection("error");
        setChatError("Não foi possível abrir esta conversa. Tente novamente.");
      }
    })();

    return () => {
      active = false;
      cancelPendingSubscribe?.();
      if (channelRef.current === channel) channelRef.current = null;
      if (conversationGenerationRef.current === generation) {
        conversationGenerationRef.current += 1;
      }
      void client.removeChannel(channel);
    };
  }, [conversation, displayName, retryCount, selectedTopic, token, userId]);

  useLayoutEffect(() => {
    const messageList = messageListRef.current;
    if (!messageList) return;
    const previousHeight = previousScrollHeightRef.current;
    if (previousHeight !== null) {
      messageList.scrollTop += messageList.scrollHeight - previousHeight;
      previousScrollHeightRef.current = null;
      return;
    }
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function loadOlderMessages() {
    if (!supabase || !selectedTopic || loadingHistory || !messages.length)
      return;
    const generation = conversationGenerationRef.current;
    const oldest = messages[0];
    setLoadingHistory(true);
    setChatError(null);
    try {
      const page = await fetchOlderMessages(supabase, selectedTopic, oldest);
      if (generation !== conversationGenerationRef.current) return;
      if (page.messages.length) {
        if (messageListRef.current) {
          previousScrollHeightRef.current = messageListRef.current.scrollHeight;
        }
        setMessages((current) => mergeChatMessages(current, page.messages));
      }
      setHasOlderMessages(page.hasOlderMessages);
    } catch {
      if (generation !== conversationGenerationRef.current) return;
      setChatError(
        "Não foi possível carregar as mensagens anteriores. Tente novamente.",
      );
    } finally {
      if (generation === conversationGenerationRef.current) {
        setLoadingHistory(false);
      }
    }
  }

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const messageText = text.trim();
    if (
      !selectedTopic ||
      !supabase ||
      !messageText ||
      connection !== "connected"
    ) {
      return;
    }
    const generation = conversationGenerationRef.current;
    setSending(true);
    setChatError(null);
    try {
      const message = await createChatMessage(
        supabase,
        selectedTopic,
        userId,
        messageText,
      );
      if (generation !== conversationGenerationRef.current) return;
      setMessages((current) => mergeChatMessages(current, [message]));
      setText("");
    } catch {
      if (generation !== conversationGenerationRef.current) return;
      setChatError("Não foi possível enviar a mensagem. Tente novamente.");
    } finally {
      if (generation === conversationGenerationRef.current) setSending(false);
    }
  }

  return {
    messages,
    loadingHistory,
    hasOlderMessages,
    connection,
    chatError,
    onlineUserIds,
    presenceSynced,
    text,
    setText,
    sending,
    retry: () => setRetryCount((count) => count + 1),
    loadOlderMessages,
    sendMessage,
    messagesEndRef,
    messageListRef,
  };
}
