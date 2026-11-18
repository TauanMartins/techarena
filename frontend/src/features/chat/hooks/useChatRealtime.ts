import { useCurrentTimestamp } from '../../../shared/clock';
import type { TypingParticipant } from '../components/TypingIndicator';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { chatMessageFromRow, type ChatMessage } from '../api/message-mapper';
import { otherOnlineParticipantIds } from './realtime';
import { chatApi } from '../api/chat.api';

type Connection = 'idle' | 'connecting' | 'connected' | 'error';
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
  image = null,
  onMessage,
}: {
  client: SupabaseClient | null;
  topic: string | null;
  token: string;
  userId: string;
  displayName: string;
  image?: string | null;
  onMessage: (message: ChatMessage) => void;
}) {
  const now = useCurrentTimestamp();
  const [typing, setTypingPeople] = useState<{
    topic: string | null;
    people: TypingParticipant[];
  }>({ topic: null, people: [] });
  const typingSender = useRef<(value: boolean) => void>(() => {});
  const [retryCount, setRetryCount] = useState(0);
  const [state, setState] = useState<RealtimeState>({
    client: null,
    topic: null,
    token: '',
    userId: '',
    displayName: '',
    retryCount: -1,
    connection: 'idle',
    connectedTopic: null,
    error: null,
    onlineUserIds: [],
    presenceSynced: false,
  });
  const onMessageRef = useRef(onMessage);
  useLayoutEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);
  const isCurrent =
    state.client === client &&
    state.topic === topic &&
    state.token === token &&
    state.userId === userId &&
    state.displayName === displayName &&
    state.retryCount === retryCount;
  const connection =
    !client || !topic ? 'idle' : isCurrent ? state.connection : 'connecting';
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
    let subscribed = false;
    let lastTyping = 0;
    let typingTimer: ReturnType<typeof setTimeout> | undefined;
    const sendTyping = (value: boolean) => {
      if (!subscribed || !active) return;
      clearTimeout(typingTimer);
      if (!value || Date.now() - lastTyping > 2000) {
        lastTyping = value ? Date.now() : 0;
        void channel
          .send({
            type: 'broadcast',
            event: 'typing',
            payload: { userId, name: displayName, image, typing: value },
          })
          .catch(() => {});
      }
      if (value) typingTimer = setTimeout(() => sendTyping(false), 3000);
    };
    typingSender.current = sendTyping;
    const onVisibility = () => {
      if (document.hidden) sendTyping(false);
    };
    document.addEventListener('visibilitychange', onVisibility);
    const updateState = (patch: Partial<RealtimeState>) =>
      setState((current) => {
        const sameIdentity =
          current.client === client &&
          current.topic === topic &&
          current.token === token &&
          current.userId === userId &&
          current.displayName === displayName &&
          current.retryCount === retryCount;
        return {
          client,
          topic,
          token,
          userId,
          displayName,
          retryCount,
          connection: sameIdentity ? current.connection : 'connecting',
          connectedTopic: sameIdentity ? current.connectedTopic : null,
          error: sameIdentity ? current.error : null,
          onlineUserIds: sameIdentity ? current.onlineUserIds : [],
          presenceSynced: sameIdentity ? current.presenceSynced : false,
          ...patch,
        };
      });

    channel
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `topic=eq.${topic}`,
        },
        ({ new: row }) => {
          const message = chatMessageFromRow(row);
          if (active && message) onMessageRef.current(message);
        },
      )
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (
          !active ||
          !payload ||
          typeof payload.userId !== 'string' ||
          payload.userId === userId
        )
          return;
        if (typeof payload.typing !== 'boolean') return;
        const id = payload.userId;
        setTypingPeople((current) => ({
          topic,
          people: [
            ...(current.topic === topic
              ? current.people.filter(
                  (person) => person.id !== id && person.expiresAt > Date.now(),
                )
              : []),
            ...(payload.typing
              ? [
                  {
                    id,
                    name:
                      typeof payload.name === 'string'
                        ? payload.name.slice(0, 80)
                        : 'Atleta',
                    image:
                      typeof payload.image === 'string' ? payload.image : null,
                    expiresAt: Date.now() + 5000,
                  },
                ]
              : []),
          ],
        }));
      })
      .on('presence', { event: 'sync' }, () => {
        if (!active) return;
        updateState({
          onlineUserIds: otherOnlineParticipantIds(
            channel.presenceState(),
            userId,
          ),
          presenceSynced: true,
        });
      });

    void (async () => {
      try {
        await chatApi.ensureAccess(token, topic);
        await client.realtime.setAuth(token);
        if (!active) return;
        await new Promise<void>((resolve, reject) => {
          cancelSubscribe = () =>
            reject(new Error('A conexão da conversa foi cancelada.'));
          channel.subscribe((status, cause) => {
            if (!active) return;
            if (status === 'SUBSCRIBED') {
              cancelSubscribe = null;
              subscribed = true;
              updateState({ connection: 'connected', connectedTopic: topic });
              resolve();
            } else if (
              ['CHANNEL_ERROR', 'TIMED_OUT', 'CLOSED'].includes(status)
            ) {
              cancelSubscribe = null;
              subscribed = false;
              updateState({ connection: 'error', connectedTopic: null });
              reject(
                cause ??
                  new Error('Não foi possível conectar a esta conversa.'),
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
        if (active && presenceStatus !== 'ok')
          updateState({
            error: 'Não foi possível atualizar o status de presença.',
          });
      } catch {
        if (!active) return;
        updateState({
          connection: 'error',
          connectedTopic: null,
          error: 'Não foi possível abrir esta conversa. Tente novamente.',
        });
      }
    })();

    return () => {
      sendTyping(false);
      clearTimeout(typingTimer);
      document.removeEventListener('visibilitychange', onVisibility);
      typingSender.current = () => {};
      active = false;
      cancelSubscribe?.();
      void client.removeChannel(channel);
    };
  }, [client, displayName, image, retryCount, token, topic, userId]);

  const retry = useCallback(() => setRetryCount((count) => count + 1), []);
  return {
    typingPeople:
      connection === 'connected' && typing.topic === topic
        ? typing.people.filter((person) => person.expiresAt > now)
        : [],
    setTyping: (value: boolean) => typingSender.current(value),
    connection,
    connectedTopic,
    error,
    onlineUserIds,
    presenceSynced,
    retry,
    retryCount,
  };
}
