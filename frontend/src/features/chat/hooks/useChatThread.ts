import { useEffect, useLayoutEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { conversationTopic } from "../realtime";
import { mergeChatMessages, type ChatMessage } from "../message-mapper";
import type { Conversation } from "../conversations";
import { createChatMessage, loadLatestMessages, loadOlderMessages as fetchOlderMessages } from "../api/message-data";
import { supabase } from "../../../shared/supabase";
import { useChatRealtime } from "./useChatRealtime";

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
  const [chatError, setChatError] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageListRef = useRef<HTMLDivElement>(null);
  const previousScrollHeightRef = useRef<number | null>(null);
  const generationRef = useRef(0);
  const selectedTopic = useMemo(() => conversation
    ? conversationTopic(conversation.kind, conversation.kind === "direct" ? userId : conversation.id, conversation.otherUserId)
    : null, [conversation, userId]);

  const realtime = useChatRealtime({
    client: supabase,
    topic: selectedTopic,
    token,
    userId,
    displayName,
    onMessage: (message) => setMessages((current) => mergeChatMessages(current, [message])),
  });

  useEffect(() => {
    generationRef.current += 1;
    setMessages([]);
    setHasOlderMessages(false);
    setLoadingHistory(false);
    setSending(false);
    setText("");
    setChatError(null);
    previousScrollHeightRef.current = null;
  }, [realtime.retryCount, selectedTopic]);

  useEffect(() => {
    if (!supabase || !selectedTopic || realtime.connectedTopic !== selectedTopic) return;
    let active = true;
    const generation = generationRef.current;
    setLoadingHistory(true);
    void loadLatestMessages(supabase, selectedTopic).then((history) => {
      if (!active || generation !== generationRef.current) return;
      setMessages((current) => mergeChatMessages(current, history.messages));
      setHasOlderMessages(history.hasOlderMessages);
    }).catch(() => {
      if (active && generation === generationRef.current) setChatError("Não foi possível carregar o histórico. Tente novamente.");
    }).finally(() => {
      if (active && generation === generationRef.current) setLoadingHistory(false);
    });
    return () => { active = false; };
  }, [realtime.connectedTopic, selectedTopic]);

  useEffect(() => {
    if (realtime.error) setChatError(realtime.error);
  }, [realtime.error]);

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
    if (!supabase || !selectedTopic || loadingHistory || !messages.length) return;
    const generation = generationRef.current;
    setLoadingHistory(true);
    setChatError(null);
    try {
      const page = await fetchOlderMessages(supabase, selectedTopic, messages[0]);
      if (generation !== generationRef.current) return;
      if (page.messages.length) {
        if (messageListRef.current) previousScrollHeightRef.current = messageListRef.current.scrollHeight;
        setMessages((current) => mergeChatMessages(current, page.messages));
      }
      setHasOlderMessages(page.hasOlderMessages);
    } catch {
      if (generation === generationRef.current) setChatError("Não foi possível carregar as mensagens anteriores. Tente novamente.");
    } finally {
      if (generation === generationRef.current) setLoadingHistory(false);
    }
  }

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const messageText = text.trim();
    if (!selectedTopic || !supabase || !messageText || realtime.connection !== "connected") return;
    const generation = generationRef.current;
    setSending(true);
    setChatError(null);
    try {
      const message = await createChatMessage(supabase, selectedTopic, userId, messageText);
      if (generation !== generationRef.current) return;
      setMessages((current) => mergeChatMessages(current, [message]));
      setText("");
    } catch {
      if (generation === generationRef.current) setChatError("Não foi possível enviar a mensagem. Tente novamente.");
    } finally {
      if (generation === generationRef.current) setSending(false);
    }
  }

  return {
    messages,
    loadingHistory,
    hasOlderMessages,
    connection: realtime.connection,
    chatError,
    onlineUserIds: realtime.onlineUserIds,
    presenceSynced: realtime.presenceSynced,
    text,
    setText,
    sending,
    retry: realtime.retry,
    loadOlderMessages,
    sendMessage,
    messagesEndRef,
    messageListRef,
  };
}
