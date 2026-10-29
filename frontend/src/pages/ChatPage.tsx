import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { useNavigate, useParams } from 'react-router-dom';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import { useAuth } from '../auth/AuthProvider';
import { EmptyState, ErrorState, LoadingState, PageHeading } from '../components/Feedback';
import { conversationTopic, isChatMessage, type ChatMessage, type ConversationKind } from '../features/chat/realtime';
import { api } from '../shared/api';
import { supabase } from '../shared/supabase';
import type { AppointmentMembership, TeamMembership } from '../shared/types';

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
  const [connection, setConnection] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [listError, setListError] = useState<string | null>(null);
  const [chatError, setChatError] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

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

  useEffect(() => {
    if (!loadingList && !routeKind && !routeId && conversations[0]) {
      const first = conversations[0];
      navigate(`/chat/${first.kind}/${first.id}`, { replace: true });
    }
  }, [conversations, loadingList, navigate, routeId, routeKind]);

  useEffect(() => {
    const client = supabase;
    if (!selected || !client) {
      setMessages([]);
      setConnection('idle');
      setChatError(null);
      return;
    }
    let active = true;
    const topic = conversationTopic(selected.kind, selected.id, selected.otherUserId);
    setMessages([]);
    setConnection('connecting');
    setChatError(null);
    void client.realtime
      .setAuth(token)
      .then(() => {
        if (!active) return;
        const channel = client.channel(topic, {
          config: {
            private: true,
            broadcast: { self: false },
            presence: { key: userId },
          },
        });
        channelRef.current = channel;
        channel
          .on('broadcast', { event: 'message' }, ({ payload }) => {
            if (active && isChatMessage(payload)) {
              setMessages((current) => current.some((message) => message.id === payload.id) ? current : [...current, payload]);
            }
          })
          .subscribe((status, error) => {
            if (!active) return;
            if (status === 'SUBSCRIBED') setConnection('connected');
            if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
              setConnection('error');
              setChatError(error?.message ?? 'Não foi possível conectar ao canal privado do Supabase Realtime.');
            }
          });
      })
      .catch((cause: unknown) => {
        if (!active) return;
        setConnection('error');
        setChatError(cause instanceof Error ? cause.message : 'Falha ao autenticar o canal Realtime.');
      });

    return () => {
      active = false;
      if (channelRef.current) {
        void client.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [selected, token, userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const messageText = text.trim();
    if (!selected || !supabase || !channelRef.current || !messageText || connection !== 'connected') return;
    setSending(true);
    setChatError(null);
    const message: ChatMessage = {
      id: crypto.randomUUID(),
      userId,
      name: profile?.name ?? profile?.username ?? 'Atleta',
      text: messageText,
      createdAt: new Date().toISOString(),
    };
    try {
      const status = await channelRef.current.send({
        type: 'broadcast',
        event: 'message',
        payload: message,
      });
      if (status !== 'ok') throw new Error(`O Supabase não confirmou o envio (${status}).`);
      setMessages((current) => [...current, message]);
      setText('');
    } catch (cause) {
      setChatError(cause instanceof Error ? cause.message : 'Não foi possível enviar a mensagem.');
    } finally {
      setSending(false);
    }
  }

  const openConversation = (conversation: Conversation) => {
    navigate(`/chat/${conversation.kind}/${conversation.id}`);
  };

  return (
    <>
      <PageHeading eyebrow="CONEXÃO EM TEMPO REAL" title="Conversas" description="Converse com suas amizades, equipes e participantes de agendamentos." />
      <Alert variant="info" className="chat-retention-note">
        <i className="bi bi-info-circle me-2" />
        As mensagens usam Broadcast privado do Supabase Realtime, conforme as políticas de acesso. O backend atual não persiste histórico; mensagens não ficam salvas após encerrar a sessão.
      </Alert>
      {listError && <ErrorState message={listError} />}
      <div className="chat-layout">
        <aside className="chat-list-panel">
          <div className="chat-list-heading"><strong>Conversas</strong><Button size="sm" variant="light" onClick={() => void loadConversations()} aria-label="Atualizar conversas"><i className="bi bi-arrow-clockwise" /></Button></div>
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
              <span className="chat-list-copy"><strong>{conversation.label}</strong><small>{conversation.detail}</small></span>
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
                <div><strong>{selected.label}</strong><small>{selected.detail} · Canal privado</small></div>
                <span className={`realtime-status ${connection}`}><i className="bi bi-circle-fill" />{connection === 'connected' ? 'Conectado' : connection === 'connecting' ? 'Conectando...' : connection === 'error' ? 'Falha de conexão' : 'Desconectado'}</span>
              </header>
              <div className="message-list" aria-live="polite">
                {messages.length === 0 && (
                  <div className="message-empty">Conversa aberta. As mensagens enviadas durante esta conexão aparecerão aqui.</div>
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
