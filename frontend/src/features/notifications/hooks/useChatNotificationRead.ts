import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '../api/notifications.api';
import { notificationKey } from './notification-key';

/** Reading a visible conversation acknowledges that conversation only; no write while backgrounded. */
export function useChatNotificationRead(userId: string, path: string) {
  const cache = useQueryClient();
  useEffect(() => {
    if (
      !userId ||
      !/^\/chat\/(direct|team|appointment)\/[a-zA-Z0-9-]+$/.test(path)
    )
      return;
    let active = true;
    const acknowledge = () => {
      if (document.visibilityState !== 'visible') return;
      void notificationsApi
        .markConversationRead(path)
        .then(() => {
          if (active)
            void cache.invalidateQueries({ queryKey: notificationKey(userId) });
        })
        .catch(() => {
          /* Leave unread on failure; retry on next focus instead of disrupting chat. */
        });
    };
    acknowledge();
    document.addEventListener('visibilitychange', acknowledge);
    window.addEventListener('focus', acknowledge);
    return () => {
      active = false;
      document.removeEventListener('visibilitychange', acknowledge);
      window.removeEventListener('focus', acknowledge);
    };
  }, [cache, path, userId]);
}
