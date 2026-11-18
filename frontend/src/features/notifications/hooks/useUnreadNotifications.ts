import { useQuery } from '@tanstack/react-query';
import { notificationsApi } from '../api/notifications.api';
import { notificationKey } from './notification-key';

export function useUnreadNotifications(userId: string) {
  return useQuery({
    queryKey: [...notificationKey(userId), 'count'],
    queryFn: () => notificationsApi.unreadCount(userId),
    enabled: Boolean(userId),
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
}
