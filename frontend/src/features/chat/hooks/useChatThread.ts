import { useEffect, useLayoutEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { conversationTopic } from "../realtime";
import { mergeChatMessages, type ChatMessage } from "../message-mapper";
import type { Conversation } from "../conversations";
import { createChatMessage, loadLatestMessages, loadOlderMessages as fetchOlderMessages } from "../api/message-data";
import { supabase } from "../../../shared/supabase";
import { useChatRealtime } from "./useChatRealtime";

interface ThreadDraft {
  key: string;
  messages: ChatMessage[];
  text: string;
  loadingOlder: boolean;
  hasOlder: boolean | null;
  sending: boolean;
  error: string | null;
}

function emptyDraft(key: string): ThreadDraft {
  return { key, messages: [], text: "", loadingOlder: false, hasOlder: null, sending: false, error: null };
}

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
  const [draft, setDraft] = useState<ThreadDraft>(() => emptyDraft(""));
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageListRef = useRef<HTMLDivElement>(null);
  const previousScrollHeightRef = useRef<number | null>(null);
  const generationRef = useRef(0);
  const selectedTopic = useMemo(() => conversation
    ? conversationTopic(conversation.kind, conversation.kind === "direct" ? userId : conversation.id, conversation.otherUserId)
    : null, [conversation, userId]);
  const draftKey = `${selectedTopic ?? ""}:${selectedTopic ? "active" : "idle"}`;
  const currentDraft = draft.key === draftKey ? draft : emptyDraft(draftKey);
  const updateDraft = (update: Partial<ThreadDraft> | ((current: ThreadDraft) => Partial<ThreadDraft>)) => {
    setDraft((previous) => {
      const base = previous.key === draftKey ? previous : emptyDraft(draftKey);
      return { ...base, ...(typeof update === "function" ? update(base) : update) };
    });
  };

  const realtime = useChatRealtime({
    client: supabase,
    topic: selectedTopic,
    token,
    userId,
    displayName,
    onMessage: (message) => updateDraft((current) => ({ messages: mergeChatMessages(current.messages, [message]) })),
  });
  const historyQuery = useQuery({
    queryKey: ["chatHistory", userId, selectedTopic],
    queryFn: () => {
      if (!supabase || !selectedTopic) throw new Error("Conversa indisponível.");
      return loadLatestMessages(supabase, selectedTopic);
    },
    enabled: Boolean(supabase && selectedTopic && realtime.connectedTopic === selectedTopic),
  });

  useEffect(() => {
    generationRef.current += 1;
    previousScrollHeightRef.current = null;
  }, [draftKey, realtime.retryCount]);

  const messages = useMemo(
    () => mergeChatMessages(historyQuery.data?.messages ?? [], currentDraft.messages),
    [currentDraft.messages, historyQuery.data?.messages],
  );
  const hasOlderMessages = currentDraft.hasOlder ?? historyQuery.data?.hasOlderMessages ?? false;
  const chatError = currentDraft.error ?? realtime.error ?? (historyQuery.error ? "Não foi possível carregar o histórico. Tente novamente." : null);

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
    if (!supabase || !selectedTopic || currentDraft.loadingOlder || !messages.length) return;
    const generation = generationRef.current;
    updateDraft({ loadingOlder: true, error: null });
    try {
      const page = await fetchOlderMessages(supabase, selectedTopic, messages[0]);
      if (generation !== generationRef.current) return;
      if (page.messages.length) {
        if (messageListRef.current) previousScrollHeightRef.current = messageListRef.current.scrollHeight;
        updateDraft((current) => ({ messages: mergeChatMessages(current.messages, page.messages), hasOlder: page.hasOlderMessages }));
      } else {
        updateDraft({ hasOlder: page.hasOlderMessages });
      }
    } catch {
      if (generation === generationRef.current) updateDraft({ error: "Não foi possível carregar as mensagens anteriores. Tente novamente." });
    } finally {
      if (generation === generationRef.current) updateDraft({ loadingOlder: false });
    }
  }

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const messageText = currentDraft.text.trim();
    if (!selectedTopic || !supabase || !messageText || realtime.connection !== "connected") return;
    const generation = generationRef.current;
    updateDraft({ sending: true, error: null });
    try {
      const message = await createChatMessage(supabase, selectedTopic, userId, messageText);
      if (generation !== generationRef.current) return;
      updateDraft((current) => ({ messages: mergeChatMessages(current.messages, [message]), text: "" }));
    } catch {
      if (generation === generationRef.current) updateDraft({ error: "Não foi possível enviar a mensagem. Tente novamente." });
    } finally {
      if (generation === generationRef.current) updateDraft({ sending: false });
    }
  }

  return {
    messages,
    loadingHistory: historyQuery.isFetching || currentDraft.loadingOlder,
    hasOlderMessages,
    connection: realtime.connection,
    chatError,
    onlineUserIds: realtime.onlineUserIds,
    presenceSynced: realtime.presenceSynced,
    text: currentDraft.text,
    setText: (text: string) => updateDraft({ text }),
    sending: currentDraft.sending,
    retry: realtime.retry,
    loadOlderMessages,
    sendMessage,
    messagesEndRef,
    messageListRef,
  };
}
