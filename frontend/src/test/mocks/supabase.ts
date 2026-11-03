import { vi } from 'vitest';
import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';

type Handler = (...args: any[]) => void;

export function createSupabaseMock() {
  const handlers = new Map<string, Handler>();
  const presence = vi.fn(() => ({}));
  let queryResult: { data: unknown; error: Error | null } = { data: [], error: null };
  const query = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    or: vi.fn(() => query),
    order: vi.fn(() => query),
    limit: vi.fn(async () => queryResult),
    insert: vi.fn(() => query),
    single: vi.fn(async () => queryResult),
  };
  const channel = {
    on: vi.fn((type: string, filter: { event?: string }, callback: Handler) => {
      handlers.set(`${type}:${filter.event ?? ''}`, callback);
      return channel;
    }),
    subscribe: vi.fn((callback?: (status: string, error?: Error) => void) => {
      callback?.('SUBSCRIBED');
      return channel;
    }),
    track: vi.fn().mockResolvedValue('ok'),
    presenceState: presence,
    unsubscribe: vi.fn().mockResolvedValue('ok'),
  };
  const client = {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'test-user' } }, error: null }),
      getSession: vi.fn().mockResolvedValue({ data: { session: { access_token: 'test-token' } }, error: null }),
    },
    channel: vi.fn(() => channel),
    from: vi.fn(() => query),
    removeChannel: vi.fn().mockResolvedValue('ok'),
    realtime: { setAuth: vi.fn().mockResolvedValue(undefined) },
  };

  return {
    client: client as unknown as SupabaseClient,
    channel: channel as unknown as RealtimeChannel,
    handlers,
    presence,
    query,
    setQueryResult(result: { data: unknown; error: Error | null }) {
      queryResult = result;
    },
    emit(type: string, event: string, ...args: unknown[]) {
      handlers.get(`${type}:${event}`)?.(...args);
    },
  };
}
