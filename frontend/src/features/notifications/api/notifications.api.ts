import { supabase } from '../../../lib/supabase-client';
import type {
  AppNotification,
  NotificationCursor,
} from '../types/notification';
const PAGE_SIZE = 20;

function client() {
  if (!supabase) throw new Error('Notificações indisponíveis.');
  return supabase;
}

export const notificationsApi = {
  async list(userId: string, unread: boolean, cursor?: NotificationCursor) {
    let request = client()
      .from('notifications')
      .select('id,kind,title,body,target_path,created_at,read_at')
      .eq('recipient_id', userId)
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(PAGE_SIZE + 1);
    if (unread) request = request.is('read_at', null);
    if (cursor)
      request = request.or(
        `created_at.lt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.lt.${cursor.id})`,
      );
    const { data, error } = await request;
    if (error) throw new Error('Não foi possível carregar as notificações.');
    const rows = (data ?? []) as AppNotification[];
    const items = rows.slice(0, PAGE_SIZE);
    const last = items.at(-1);
    return {
      items,
      nextCursor:
        rows.length > PAGE_SIZE && last
          ? { createdAt: last.created_at, id: last.id }
          : undefined,
    };
  },
  async unreadCount(userId: string) {
    const { count, error } = await client()
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('recipient_id', userId)
      .is('read_at', null);
    if (error) throw new Error('Não foi possível atualizar as notificações.');
    return count ?? 0;
  },
  async markConversationRead(path: string) {
    const { error } = await client().rpc('mark_chat_notifications_read', {
      conversation_path: path,
    });
    if (error)
      throw new Error('Não foi possível registrar a leitura da conversa.');
  },
  async markRead(id?: string) {
    const { error } = await client().rpc('mark_notifications_read', {
      notification_id: id ?? null,
    });
    if (error)
      throw new Error('Não foi possível marcar as notificações como lidas.');
  },
};
