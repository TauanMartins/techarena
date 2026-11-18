import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { notificationsApi } from '../api/notifications.api';
import type { NotificationCursor } from '../types/notification';

import { notificationKey } from './notification-key';
export function useNotifications(userId: string, unread: boolean) {
  const cache = useQueryClient();
  const inbox = useInfiniteQuery({
    queryKey: [...notificationKey(userId), 'list', unread],
    queryFn: ({ pageParam }) =>
      notificationsApi.list(userId, unread, pageParam),
    initialPageParam: undefined as NotificationCursor | undefined,
    getNextPageParam: (last) => last.nextCursor,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
  const markRead = useMutation({
    mutationFn: (id?: string) => notificationsApi.markRead(id),
    onSuccess: () =>
      cache.invalidateQueries({ queryKey: notificationKey(userId) }),
  });
  return { inbox, markRead };
}
