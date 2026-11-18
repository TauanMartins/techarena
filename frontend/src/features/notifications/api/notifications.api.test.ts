import { beforeEach, expect, it, vi } from 'vitest';
import { notificationsApi } from './notifications.api';
const mocks = vi.hoisted(() => ({ from: vi.fn(), rpc: vi.fn() }));
vi.mock('../../../lib/supabase-client', () => ({ supabase: mocks }));
const query = {
  select: vi.fn(),
  eq: vi.fn(),
  order: vi.fn(),
  limit: vi.fn(),
  is: vi.fn(),
  or: vi.fn(),
  then: vi.fn(),
};
beforeEach(() => {
  vi.clearAllMocks();
  for (const name of ['select', 'eq', 'order', 'limit', 'is', 'or'] as const)
    query[name].mockReturnValue(query);
  mocks.from.mockReturnValue(query);
});
it('uses a stable cursor, filters by recipient, and retains the extra row for pagination', async () => {
  const rows = Array.from({ length: 21 }, (_, id) => ({
    id: String(id),
    created_at: '2026-11-18T12:00:00Z',
  }));
  query.then.mockImplementation((resolve) =>
    resolve({ data: rows, error: null }),
  );
  const result = await notificationsApi.list('me', true, {
    id: 'older',
    createdAt: rows[0].created_at,
  });
  expect(query.eq).toHaveBeenCalledWith('recipient_id', 'me');
  expect(query.is).toHaveBeenCalledWith('read_at', null);
  expect(query.or).toHaveBeenCalledWith(
    'created_at.lt.2026-11-18T12:00:00Z,and(created_at.eq.2026-11-18T12:00:00Z,id.lt.older)',
  );
  expect(result.items).toHaveLength(20);
  expect(result.nextCursor?.id).toBe('19');
});
it('counts unread records and acknowledges through the scoped RPC', async () => {
  query.then.mockImplementation((resolve) =>
    resolve({ count: 4, error: null }),
  );
  expect(await notificationsApi.unreadCount('me')).toBe(4);
  mocks.rpc.mockResolvedValue({ error: null });
  await notificationsApi.markRead('id');
  expect(mocks.rpc).toHaveBeenCalledWith('mark_notifications_read', {
    notification_id: 'id',
  });
  await notificationsApi.markRead();
  expect(mocks.rpc).toHaveBeenLastCalledWith('mark_notifications_read', {
    notification_id: null,
  });
});
it('reports failures without displaying raw database errors', async () => {
  query.then.mockImplementation((resolve) =>
    resolve({ error: { message: 'internal' } }),
  );
  mocks.rpc.mockResolvedValue({ error: { message: 'internal' } });
  await expect(notificationsApi.list('me', false)).rejects.toThrow(
    'Não foi possível carregar',
  );
  await expect(notificationsApi.unreadCount('me')).rejects.toThrow(
    'Não foi possível atualizar',
  );
  await expect(notificationsApi.markRead()).rejects.toThrow(
    'Não foi possível marcar',
  );
});
