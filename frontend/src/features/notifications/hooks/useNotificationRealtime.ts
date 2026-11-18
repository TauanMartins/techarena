import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { supabase } from '../../../lib/supabase-client';
import { notificationKey } from './notification-key';
import { notificationQueryPrefixes } from '../notification-query-prefixes';
import { notificationsApi } from '../api/notifications.api';
import { useChatNotificationRead } from './useChatNotificationRead';

/** Realtime invalidates queries; authenticated reads remain the source of truth. */
export function useNotificationRealtime(userId: string) {
  const cache = useQueryClient();
  const { pathname } = useLocation();
  const path = useRef(pathname);
  useEffect(() => {
    path.current = pathname;
  }, [pathname]);
  useChatNotificationRead(userId, pathname);
  useEffect(() => {
    const client = supabase;
    if (!client || !userId) return;
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const prefixes = new Set<string>();
    const refresh = () => {
      if (!active) return;
      for (const prefix of prefixes)
        void cache.invalidateQueries({ queryKey: [prefix, userId] });
      prefixes.clear();
      void cache.invalidateQueries({ queryKey: notificationKey(userId) });
    };
    const resync = () => {
      if (document.visibilityState !== 'visible') return;
      notificationQueryPrefixes().forEach((prefix) => prefixes.add(prefix));
      refresh();
    };
    const channel = client
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${userId}`,
        },
        (event) => {
          if (!active) return;
          if (event.eventType === 'INSERT' && 'kind' in event.new) {
            notificationQueryPrefixes(String(event.new.kind)).forEach(
              (prefix) => prefixes.add(prefix),
            );
            if (
              event.new.kind === 'chat.message' &&
              event.new.target_path === path.current &&
              document.visibilityState === 'visible'
            ) {
              void notificationsApi.markRead(String(event.new.id)).catch(() => {
                /* Keep unread if acknowledgment fails. */
              });
            }
          }
          if (timer) clearTimeout(timer);
          timer = setTimeout(refresh, 200);
        },
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') resync();
      });
    window.addEventListener('focus', resync);
    document.addEventListener('visibilitychange', resync);
    return () => {
      active = false;
      clearTimeout(timer);
      window.removeEventListener('focus', resync);
      document.removeEventListener('visibilitychange', resync);
      void client.removeChannel(channel);
    };
  }, [cache, userId]);
}
