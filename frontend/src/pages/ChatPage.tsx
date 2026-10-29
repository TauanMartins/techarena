import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Image from 'react-bootstrap/Image';
import Modal from 'react-bootstrap/Modal';
import { useAuth } from '../auth/useAuth';
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeading,
} from '../components/Feedback';
import { ProfileAvatar } from '../components/ProfileAvatar';
import {
  chatMessageFromRow,
  conversationTopic,
  mergeChatMessages,
  otherOnlineParticipantIds,
  type ChatMessage,
  type ConversationKind,
} from '../features/chat/realtime';
import { api } from '../shared/api';
import { queryKeys } from '../shared/queryClient';
import { supabase } from '../shared/supabase';
import type { AppointmentMembership, TeamMembership } from '../shared/types';

const HISTORY_PAGE_SIZE = 50;
const MESSAGE_COLUMNS = 'id, sender_id, sender_name, body, created_at';

interface Conversation {
  id: string;
  kind: ConversationKind;
  label: string;
  otherUserId?: string;
  username?: string | null;
  image?: string | null;
  detail?: string;
  description?: string | null;
  scheduledAt?: string;
  status?: string;
  role?: string;
}

export function ChatPage() {
  const { session, profile } = useAuth();
  const token = session!.access_token;
  const userId = session!.user.id;
  const { kind: routeKind, id: routeId } = useParams();
  const navigate = useNavigate();
  const conversationsQuery = useQuery({
    queryKey: queryKeys.chatConversations(userId),
    queryFn: async () => {
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
        username: friend.user.username,
        image: friend.user.image,
        detail: 'Amizade',
      }));
      const teamConversations: Conversation[] = teams.items.map(
        (team: TeamMembership) => ({
          id: team.id,
          kind: 'team',
          label: team.name,
          image: team.image,
          description: team.description,
          role: team.role,
          detail: 'Equipe',
        }),
      );
      const appointmentConversations: Conversation[] = appointments.items.map(
        (appointment: AppointmentMembership) => ({
          id: appointment.id,
          kind: 'appointment',
          label: appointment.title,
          description: appointment.description,
          scheduledAt: appointment.scheduledAt,
          status: appointment.status,
          detail: new Date(appointment.scheduledAt).toLocaleDateString('pt-BR'),
        }),
      );
      return [...direct, ...teamConversations, ...appointmentConversations];
    },
  });
  const conversations = conversationsQuery.data ?? [];
  const loadingList = conversationsQuery.isPending;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [hasOlderMessages, setHasOlderMessages] = useState(false);
  const [connection, setConnection] = useState<
    'idle' | 'connecting' | 'connected' | 'error'
  >('idle');
  const [chatError, setChatError] = useState<string | null>(null);
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);
  const [presenceSynced, setPresenceSynced] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageListRef = useRef<HTMLDivElement>(null);
  const previousScrollHeightRef = useRef<number | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const conversationGenerationRef = useRef(0);

  const selected = useMemo(
    () =>
      conversations.find(
        (conversation) =>
          conversation.kind === routeKind && conversation.id === routeId,
      ),
    [conversations, routeId, routeKind],
  );
  const selectedTopic = useMemo(
    () =>
      selected
        ? conversationTopic(
            selected.kind,
            selected.kind === 'direct' ? userId : selected.id,
            selected.otherUserId,
          )
        : null,
    [selected, userId],
  );

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
            reject(new Error('A conexão da conversa foi cancelada.'));
          };
          channel.subscribe((status, error) => {
            if (!active) return;
            if (status === 'SUBSCRIBED') {
              cancelPendingSubscribe = null;
              setConnection('connected');
              resolve();
            } else if (
              status === 'CHANNEL_ERROR' ||
              status === 'TIMED_OUT' ||
              status === 'CLOSED'
            ) {
              cancelPendingSubscribe = null;
              setConnection('error');
              reject(
                error ??
                  new Error('Não foi possível conectar a esta conversa.'),
              );
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
          setChatError('Não foi possível atualizar o status de presença.');
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
      } catch {
        if (!active) return;
        setConnection('error');
        setChatError('Não foi possível abrir esta conversa. Tente novamente.');
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
  }, [
    profile?.name,
    profile?.username,
    retryCount,
    selected,
    selectedTopic,
    token,
    userId,
  ]);

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
    if (!supabase || !selectedTopic || loadingHistory || !messages.length)
      return;
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
    } catch {
      if (generation !== conversationGenerationRef.current) return;
      setChatError(
        'Não foi possível carregar as mensagens anteriores. Tente novamente.',
      );
    } finally {
      if (generation === conversationGenerationRef.current)
        setLoadingHistory(false);
    }
  }

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const messageText = text.trim();
    if (
      !selectedTopic ||
      !supabase ||
      !messageText ||
      connection !== 'connected'
    )
      return;
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
      if (!message) throw new Error('A mensagem não pôde ser carregada.');
      setMessages((current) => mergeChatMessages(current, [message]));
      setText('');
    } catch {
      if (generation !== conversationGenerationRef.current) return;
      setChatError('Não foi possível enviar a mensagem. Tente novamente.');
    } finally {
      if (generation === conversationGenerationRef.current) setSending(false);
    }
  }

  const openConversation = (conversation: Conversation) => {
    navigate(`/chat/${conversation.kind}/${conversation.id}`);
  };
  const otherParticipantOnline = Boolean(
    selected?.otherUserId &&
    selected.otherUserId.toLowerCase() !== userId.toLowerCase() &&
    onlineUserIds.includes(selected.otherUserId),
  );

  return (
    <div
      className={`chat-page${selected ? ' is-thread' : ' is-inbox'}`}
    >
      <PageHeading
        eyebrow="CONEXÃO EM TEMPO REAL"
        title="Conversas"
        description="Converse com suas amizades, equipes e participantes de agendamentos."
      />
      {conversationsQuery.error && (
        <div className="chat-page-error">
          <ErrorState
            message={
              conversationsQuery.error instanceof Error
                ? conversationsQuery.error.message
                : 'Não foi possível carregar as conversas. Tente novamente.'
            }
          />
        </div>
      )}
      <div className={`chat-layout${selected ? ' has-selection' : ''}`}>
        <aside className="chat-list-panel">
          <div className="chat-list-heading">
            <div>
              <strong>Conversas</strong>
              {!loadingList && (
                <small>
                  {conversations.length}{' '}
                  {conversations.length === 1 ? 'conversa' : 'conversas'}
                </small>
              )}
            </div>
            <Button
              size="sm"
              variant="light"
              onClick={() => void conversationsQuery.refetch()}
              aria-label="Atualizar conversas"
            >
              <i className="bi bi-arrow-clockwise" />
            </Button>
          </div>
          {loadingList && <LoadingState label="Carregando..." />}
          {!loadingList && !conversations.length && (
            <div className="chat-list-empty">
              Adicione amizades, entre em equipes ou participe de partidas para
              iniciar uma conversa.
            </div>
          )}
          {conversations.map((conversation) => (
            <button
              type="button"
              key={`${conversation.kind}-${conversation.id}`}
              className={`chat-list-item${selected?.kind === conversation.kind && selected.id === conversation.id ? ' active' : ''}`}
              onClick={() => openConversation(conversation)}
            >
              {conversation.kind === 'direct' ? (
                <ProfileAvatar
                  name={conversation.label}
                  image={conversation.image ?? null}
                  className="chat-avatar"
                />
              ) : conversation.image ? (
                <Image
                  className="chat-avatar"
                  src={conversation.image}
                  alt={`Imagem de ${conversation.label}`}
                  roundedCircle
                />
              ) : (
                <span className="chat-avatar">
                  <i
                    className={`bi ${conversation.kind === 'team' ? 'bi-people-fill' : 'bi-calendar2-event'}`}
                  />
                </span>
              )}
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
              <EmptyState
                icon="bi-chat-dots"
                title="Escolha uma conversa"
                description="As conversas privadas disponíveis para sua conta aparecem nesta lista."
              />
            </div>
          ) : (
            <>
              <header className="chat-thread-header">
                <Button
                  size="sm"
                  variant="light"
                  className="chat-back-button"
                  onClick={() => navigate('/chat')}
                  aria-label="Voltar para conversas"
                >
                  <i className="bi bi-arrow-left" aria-hidden="true" />
                </Button>
                {selected.kind === 'direct' ? (
                  <ProfileAvatar
                    name={selected.label}
                    image={selected.image ?? null}
                    className="chat-avatar"
                  />
                ) : selected.image ? (
                  <Image
                    className="chat-avatar"
                    src={selected.image}
                    alt={`Imagem de ${selected.label}`}
                    roundedCircle
                  />
                ) : (
                  <span className="chat-avatar">
                    <i
                      className={`bi ${selected.kind === 'team' ? 'bi-people-fill' : 'bi-calendar2-event'}`}
                    />
                  </span>
                )}
                <div>
                  <strong>{selected.label}</strong>
                  <small>
                    {selected.kind === 'direct'
                      ? !presenceSynced
                        ? 'Verificando presença...'
                        : otherParticipantOnline
                          ? 'Pessoa online agora'
                          : 'Pessoa offline'
                      : !presenceSynced
                        ? 'Verificando presença...'
                        : `${Math.max(0, onlineUserIds.filter((id) => id !== userId).length)} outras pessoas online`}
                  </small>
                </div>
                <span className={`realtime-status ${connection}`}>
                  <i className="bi bi-circle-fill" />
                  {connection === 'connected'
                    ? 'Sua conexão: conectada'
                    : connection === 'connecting'
                      ? 'Sua conexão: conectando...'
                      : connection === 'error'
                        ? 'Sua conexão: indisponível'
                        : 'Sua conexão: desconectada'}
                </span>
                <Button
                  size="sm"
                  variant="outline-secondary"
                  onClick={() => setShowDetails(true)}
                  aria-label="Detalhes da conversa"
                >
                  <i className="bi bi-info-circle" aria-hidden="true" />
                  <span className="chat-details-label">Detalhes</span>
                </Button>
                {connection === 'error' && (
                  <Button
                    size="sm"
                    variant="light"
                    onClick={() => setRetryCount((count) => count + 1)}
                    aria-label="Reconectar conversa"
                  >
                    <i className="bi bi-arrow-clockwise" />
                  </Button>
                )}
              </header>
              <div
                className="message-list"
                aria-live="polite"
                ref={messageListRef}
              >
                {hasOlderMessages && (
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    className="align-self-center"
                    disabled={loadingHistory}
                    onClick={() => void loadOlderMessages()}
                  >
                    {loadingHistory
                      ? 'Carregando...'
                      : 'Carregar mensagens anteriores'}
                  </Button>
                )}
                {connection === 'connecting' && messages.length === 0 && (
                  <LoadingState label="Conectando e carregando o histórico..." />
                )}
                {connection === 'error' && messages.length === 0 && (
                  <div className="message-empty">
                    Não foi possível abrir esta conversa.
                  </div>
                )}
                {connection === 'connected' && messages.length === 0 && (
                  <div className="message-empty">
                    Nenhuma mensagem ainda. Envie a primeira para iniciar a
                    conversa.
                  </div>
                )}
                {messages.map((message) => {
                  const own = message.userId === userId;
                  return (
                    <div
                      className={`message-row${own ? ' own' : ''}`}
                      key={message.id}
                    >
                      {!own && (
                        <span className="message-author">{message.name}</span>
                      )}
                      <div className="message-bubble">
                        <span>{message.text}</span>
                        <time>
                          {new Date(message.createdAt).toLocaleTimeString(
                            'pt-BR',
                            { hour: '2-digit', minute: '2-digit' },
                          )}
                        </time>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
              {chatError && (
                <div className="chat-error">
                  <ErrorState message={chatError} />
                </div>
              )}
              <Form
                onSubmit={(event) => void sendMessage(event)}
                className="chat-compose"
              >
                <Form.Control
                  aria-label="Mensagem"
                  placeholder="Escreva uma mensagem..."
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  maxLength={1000}
                  disabled={connection !== 'connected'}
                />
                <Button
                  type="submit"
                  disabled={
                    !text.trim() || sending || connection !== 'connected'
                  }
                  aria-label="Enviar mensagem"
                  title="Enviar mensagem"
                >
                  <i className="bi bi-send-fill" />
                </Button>
              </Form>
            </>
          )}
        </section>
      </div>
      <Modal
        show={showDetails && selected !== undefined}
        onHide={() => setShowDetails(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Detalhes da conversa</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selected && (
            <div className="conversation-details">
              <span className="eyebrow">
                {selected.kind === 'direct'
                  ? 'CONVERSA PRIVADA'
                  : selected.kind === 'team'
                    ? 'CONVERSA DE EQUIPE'
                    : 'CONVERSA DO AGENDAMENTO'}
              </span>
              {selected.image && selected.kind !== 'direct' && (
                <Image
                  className="conversation-detail-image"
                  src={selected.image}
                  alt={`Imagem de ${selected.label}`}
                  rounded
                />
              )}
              {selected.kind === 'direct' && (
                <ProfileAvatar
                  name={selected.label}
                  image={selected.image ?? null}
                  className="profile-detail-avatar"
                />
              )}
              <h3>{selected.label}</h3>
              {selected.kind === 'direct' && (
                <p>
                  {selected.username
                    ? `@${selected.username}`
                    : 'Atleta da sua rede'}
                </p>
              )}
              {selected.kind === 'team' && (
                <>
                  <p>
                    {selected.description ||
                      'Esta equipe ainda não tem uma descrição.'}
                  </p>
                  {selected.role && <p>Seu papel: {selected.role}</p>}
                </>
              )}
              {selected.kind === 'appointment' && (
                <>
                  <p>
                    {selected.description ||
                      'Sem descrição adicional para este agendamento.'}
                  </p>
                  {selected.scheduledAt && (
                    <p>
                      <strong>Data:</strong>{' '}
                      {new Date(selected.scheduledAt).toLocaleString('pt-BR', {
                        dateStyle: 'long',
                        timeStyle: 'short',
                      })}
                    </p>
                  )}
                  {selected.status && (
                    <p>
                      <strong>Situação:</strong>{' '}
                      {selected.status === 'scheduled'
                        ? 'Confirmado'
                        : selected.status === 'in_progress'
                          ? 'Em andamento'
                          : selected.status === 'finished'
                            ? 'Finalizado'
                            : 'Cancelado'}
                    </p>
                  )}
                </>
              )}
            </div>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
}
