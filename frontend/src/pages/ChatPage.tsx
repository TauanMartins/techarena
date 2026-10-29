import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { useNavigate, useParams } from 'react-router-dom';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import { useAuth } from '../auth/AuthProvider';
import { EmptyState, ErrorState, LoadingState, PageHeading } from '../components/Feedback';
import {
  chatMessageFromRow,
  conversationTopic,
  mergeChatMessages,
  type ChatMessage,
  type ConversationKind,
} from '../features/chat/realtime';
import { api } from '../shared/api';
import { supabase } from '../shared/supabase';
import type { AppointmentMembership, TeamMembership } from '../shared/types';

const HISTORY_PAGE_SIZE = 50;
const MESSAGE_COLUMNS = 'id, sender_id, sender_name, body, created_at';

interface Conversation {
  id: string;
  kind: ConversationKind;
  label: string;
  otherUserId?: string;
  detail?: string;
}

export function ChatPage() {
  const { session, profile } = useAuth();
  const token = session!.access_token;
  const userId = session!.user.id;
  const { kind: routeKind, id: routeId } = useParams();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [hasOlderMessages, setHasOlderMessages] = useState(false);
  const [connection, setConnection] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [listError, setListError] = useState<string | null>(null);
  const [chatError, setChatError] = useState<string | null>(null);
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);
  const [presenceSynced, setPresenceSynced] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageListRef = useRef<HTMLDivElement>(null);
  const previousScrollHeightRef = useRef<number | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const conversationGenerationRef = useRef(0);

  const loadConversations = useCallback(async () => {
    setLoadingList(true);
    setListError(null);
    try {
      const [friends, teams, appointments] = await Promise.all([
        api.listFriends(token),
        api.listMyTeams(token),
        api.listMyAppointments(token),
      ]);
      const direct: Conversation[] = friends.friends.items.map((friend) => ({
        id: friend.user.id,
        kind: 'direct',
        label: friend.user.name ?? friend.user.username ?? 'Atleta',
        otherUserId: friend.user.id,
        detail: 'Amizade',
      }));
      const teamConversations: Conversation[] = teams.items.map((team: TeamMembership) => ({
        id: team.id,
        kind: 'team',
        label: team.name,
        detail: 'Equipe',
      }));
      const appointmentConversations: Conversation[] = appointments.items.map((appointment: AppointmentMembership) => ({
        id: appointment.id,
        kind: 'appointment',
        label: appointment.title,
        detail: new Date(appointment.scheduledAt).toLocaleDateString('pt-BR'),
      }));
      setConversations([...direct, ...teamConversations, ...appointmentConversations]);
    } catch (cause) {
      setListError(cause instanceof Error ? cause.message : 'Não foi possível carregar as conversas.');
    } finally {
      setLoadingList(false);
    }
  }, [token]);

  useEffect(() => { void loadConversations(); }, [loadConversations]);

  const selected = useMemo(
    () => conversations.find((conversation) => conversation.kind === routeKind && conversation.id === routeId),
    [conversations, routeId, routeKind],
  );
  const selectedTopic = useMemo(
    () => selected
      ? conversationTopic(
        selected.kind,
        selected.kind === 'direct' ? userId : selected.id,
        selected.otherUserId,
      )
      : null,
    [selected, userId],
  );

  useEffect(() => {
    if (!loadingList && !routeKind && !routeId && conversations[0]) {
      const first = conversations[0];
      navigate(`/chat/${first.kind}/${first.id}`, { replace: true });
    }
  }, [conversations, loadingList, navigate, routeId, routeKind]);

  useEffect(() => {
    const generation = ++conversationGenerationRef.current;
    const client = supabase;
    if (!selected || !selectedTopic || !client) {
      setMessages([]);
      setOnlineUserIds([]);
      setPresenceSynced(false);
      setConnection('idle');
      setChatError(null);
      setHasOlderMessages(false);
      setLoadingHistory(false);
      setSending(false);
      setText('');
      return;
    }

    let active = true;
    let cancelPendingSubscribe: (() => void) | null = null;
    const channelTopic = `chat:${selectedTopic}`;
    setMessages([]);
    setOnlineUserIds([]);
    setPresenceSynced(false);
    setHasOlderMessages(false);
    setConnection('connecting');
    setChatError(null);
    setLoadingHistory(false);
    setSending(false);
    setText('');

    const channel = client.channel(channelTopic, {
      config: {
        private: true,
        presence: { key: userId },
      },
    });
    channelRef.current = channel;

    channel
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `topic=eq.${selectedTopic}`,
        },
        ({ new: row }) => {
          const message = chatMessageFromRow(row);
          if (active && message) {
            setMessages((current) => mergeChatMessages(current, [message]));
          }
        },
      )
      .on('presence', { event: 'sync' }, () => {
        if (active) {
          setOnlineUserIds(Object.keys(channel.presenceState()));
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
            reject(new Error('A conexão da conversa foi cancelada.'));
          };
          channel.subscribe((status, error) => {
            if (!active) return;
            if (status === 'SUBSCRIBED') {
              cancelPendingSubscribe = null;
              setConnection('connected');
              resolve();
            } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
              cancelPendingSubscribe = null;
              setConnection('error');
              reject(error ?? new Error('Não foi possível conectar ao canal privado do Supabase Realtime.'));
            }
          });
        });
        if (!active) return;

        const presenceStatus = await channel.track({
          userId,
          name: profile?.name ?? profile?.username ?? 'Atleta',
          onlineAt: new Date().toISOString(),
        });
        if (presenceStatus !== 'ok') {
          setChatError(`Presença indisponível no momento (${presenceStatus}).`);
        }

        const { data, error } = await client
          .from('chat_messages')
          .select(MESSAGE_COLUMNS)
          .eq('topic', selectedTopic)
          .order('created_at', { ascending: false })
          .order('id', { ascending: false })
          .limit(HISTORY_PAGE_SIZE);
        if (error) throw error;
        if (!active) return;

        const history = (data ?? [])
          .map(chatMessageFromRow)
          .filter((message): message is ChatMessage => message !== null)
          .reverse();
        setMessages((current) => mergeChatMessages(current, history));
        setHasOlderMessages((data?.length ?? 0) === HISTORY_PAGE_SIZE);
      } catch (cause) {
        if (!active) return;
        setConnection('error');
        setChatError(cause instanceof Error ? cause.message : 'Não foi possível abrir esta conversa.');
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
  }, [profile?.name, profile?.username, retryCount, selected, selectedTopic, token, userId]);

  useLayoutEffect(() => {
    const messageList = messageListRef.current;
    if (!messageList) return;
    const previousHeight = previousScrollHeightRef.current;
    if (previousHeight !== null) {
      messageList.scrollTop += messageList.scrollHeight - previousHeight;
      previousScrollHeightRef.current = null;
      return;
    }
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function loadOlderMessages() {
    if (!supabase || !selectedTopic || loadingHistory || !messages.length) return;
    const generation = conversationGenerationRef.current;
    const oldest = messages[0];
    setLoadingHistory(true);
    setChatError(null);
    try {
      const cursor = `created_at.lt.${oldest.createdAt},and(created_at.eq.${oldest.createdAt},id.lt.${oldest.id})`;
      const { data, error } = await supabase
        .from('chat_messages')
        .select(MESSAGE_COLUMNS)
        .eq('topic', selectedTopic)
        .or(cursor)
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })
        .limit(HISTORY_PAGE_SIZE);
      if (error) throw error;
      if (generation !== conversationGenerationRef.current) return;
      const older = (data ?? [])
        .map(chatMessageFromRow)
        .filter((message): message is ChatMessage => message !== null)
        .reverse();
      if (older.length) {
        if (messageListRef.current) {
          previousScrollHeightRef.current = messageListRef.current.scrollHeight;
        }
        setMessages((current) => mergeChatMessages(current, older));
      }
      setHasOlderMessages((data?.length ?? 0) === HISTORY_PAGE_SIZE);
    } catch (cause) {
      if (generation !== conversationGenerationRef.current) return;
      setChatError(cause instanceof Error ? cause.message : 'Não foi possível carregar o histórico anterior.');
    } finally {
      if (generation === conversationGenerationRef.current) setLoadingHistory(false);
    }
  }

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const messageText = text.trim();
    if (!selectedTopic || !supabase || !messageText || connection !== 'connected') return;
    const generation = conversationGenerationRef.current;
    setSending(true);
    setChatError(null);
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          topic: selectedTopic,
          sender_id: userId,
          body: messageText,
        })
        .select(MESSAGE_COLUMNS)
        .single();
      if (error) throw error;
      if (generation !== conversationGenerationRef.current) return;
      const message = chatMessageFromRow(data);
      if (!message) throw new Error('O Supabase retornou uma mensagem inválida.');
      setMessages((current) => mergeChatMessages(current, [message]));
      setText('');
    } catch (cause) {
      if (generation !== conversationGenerationRef.current) return;
      setChatError(cause instanceof Error ? cause.message : 'Não foi possível enviar a mensagem.');
    } finally {
      if (generation === conversationGenerationRef.current) setSending(false);
    }
  }

  const openConversation = (conversation: Conversation) => {
    navigate(`/chat/${conversation.kind}/${conversation.id}`);
  };
  const otherParticipantOnline = Boolean(
    selected?.otherUserId && onlineUserIds.includes(selected.otherUserId),
  );

  return (
    <>
      <PageHeading eyebrow="CONEXÃO EM TEMPO REAL" title="Conversas" description="Converse com suas amizades, equipes e participantes de agendamentos." />
      <Alert variant="info" className="chat-retention-note">
        <i className="bi bi-info-circle me-2" />
        O histórico fica salvo no Supabase. O status online indica quem está conectado a esta conversa agora.
      </Alert>
      {listError && <ErrorState message={listError} />}
      <div className="chat-layout">
        <aside className="chat-list-panel">
          <div className="chat-list-heading">
            <strong>Conversas</strong>
            <Button size="sm" variant="light" onClick={() => void loadConversations()} aria-label="Atualizar conversas">
              <i className="bi bi-arrow-clockwise" />
            </Button>
          </div>
          {loadingList && <LoadingState label="Carregando..." />}
          {!loadingList && !conversations.length && <div className="chat-list-empty">Adicione amizades, entre em equipes ou participe de partidas para iniciar uma conversa.</div>}
          {conversations.map((conversation) => (
            <button
              type="button"
              key={`${conversation.kind}-${conversation.id}`}
              className={`chat-list-item${selected?.kind === conversation.kind && selected.id === conversation.id ? ' active' : ''}`}
              onClick={() => openConversation(conversation)}
            >
              <span className="chat-avatar"><i className={`bi ${conversation.kind === 'direct' ? 'bi-person-fill' : conversation.kind === 'team' ? 'bi-people-fill' : 'bi-calendar2-event'}`} /></span>
              <span className="chat-list-copy">
                <strong>{conversation.label}</strong>
                <small>{conversation.detail}</small>
              </span>
            </button>
          ))}
        </aside>
        <section className="chat-thread">
          {!selected ? (
            <div className="chat-empty-thread">
              <EmptyState icon="bi-chat-dots" title="Escolha uma conversa" description="As conversas privadas disponíveis para sua conta aparecem nesta lista." />
            </div>
          ) : (
            <>
              <header className="chat-thread-header">
                <span className="chat-avatar"><i className={`bi ${selected.kind === 'direct' ? 'bi-person-fill' : selected.kind === 'team' ? 'bi-people-fill' : 'bi-calendar2-event'}`} /></span>
                <div>
                  <strong>{selected.label}</strong>
                  <small>
                    {selected.kind === 'direct'
                      ? !presenceSynced ? 'Verificando presença...' : otherParticipantOnline ? 'Online nesta conversa' : 'Offline nesta conversa'
                      : !presenceSynced ? 'Verificando presença...' : `${Math.max(0, onlineUserIds.filter((id) => id !== userId).length)} outras pessoas online`}
                  </small>
                </div>
                <span className={`realtime-status ${connection}`}><i className="bi bi-circle-fill" />{connection === 'connected' ? 'Conectado' : connection === 'connecting' ? 'Conectando...' : connection === 'error' ? 'Falha de conexão' : 'Desconectado'}</span>
                {connection === 'error' && (
                  <Button size="sm" variant="light" onClick={() => setRetryCount((count) => count + 1)} aria-label="Reconectar conversa">
                    <i className="bi bi-arrow-clockwise" />
                  </Button>
                )}
              </header>
              <div className="message-list" aria-live="polite" ref={messageListRef}>
                {hasOlderMessages && (
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    className="align-self-center"
                    disabled={loadingHistory}
                    onClick={() => void loadOlderMessages()}
                  >
                    {loadingHistory ? 'Carregando...' : 'Carregar mensagens anteriores'}
                  </Button>
                )}
                {connection === 'connecting' && messages.length === 0 && <LoadingState label="Conectando e carregando o histórico..." />}
                {connection === 'error' && messages.length === 0 && <div className="message-empty">Não foi possível abrir esta conversa.</div>}
                {connection === 'connected' && messages.length === 0 && (
                  <div className="message-empty">Nenhuma mensagem ainda. Envie a primeira para iniciar a conversa.</div>
                )}
                {messages.map((message) => {
                  const own = message.userId === userId;
                  return (
                    <div className={`message-row${own ? ' own' : ''}`} key={message.id}>
                      {!own && <span className="message-author">{message.name}</span>}
                      <div className="message-bubble">
                        <span>{message.text}</span>
                        <time>{new Date(message.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</time>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
              {chatError && <div className="chat-error"><ErrorState message={chatError} /></div>}
              <Form onSubmit={(event) => void sendMessage(event)} className="chat-compose">
                <Form.Control aria-label="Mensagem" placeholder="Escreva sua mensagem..." value={text} onChange={(event) => setText(event.target.value)} maxLength={1000} disabled={connection !== 'connected'} />
                <Button type="submit" disabled={!text.trim() || sending || connection !== 'connected'} aria-label="Enviar mensagem">
                  <i className="bi bi-send-fill" />
                </Button>
              </Form>
            </>
          )}
        </section>
      </div>
    </>
  );
}
