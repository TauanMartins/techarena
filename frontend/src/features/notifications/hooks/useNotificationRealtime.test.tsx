import { act, renderHook } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import {
  createTestQueryClient,
  createTestWrapper,
} from '../../../test/test-utils';
import { useNotificationRealtime } from './useNotificationRealtime';
const realtime = vi.hoisted(() => ({
  channel: vi.fn(),
  removeChannel: vi.fn(),
}));
vi.mock('../../../lib/supabase-client', () => ({ supabase: realtime }));
afterEach(() => {
  vi.clearAllMocks();
  vi.useRealTimers();
});
it('isolates users, coalesces bursts, resyncs on subscribe and removes old channels', () => {
  vi.useFakeTimers();
  const on = vi.fn().mockReturnThis();
  const subscribe = vi.fn().mockReturnThis();
  realtime.channel.mockReturnValue({ on, subscribe });
  const cache = createTestQueryClient();
  const invalidate = vi.spyOn(cache, 'invalidateQueries');
  const { rerender, unmount } = renderHook(
    ({ userId }) => useNotificationRealtime(userId),
    { initialProps: { userId: 'one' }, wrapper: createTestWrapper(cache) },
  );
  expect(on.mock.calls[0][1]).toMatchObject({
    filter: 'recipient_id=eq.one',
    table: 'notifications',
  });
  act(() => subscribe.mock.calls[0][0]('SUBSCRIBED'));
  expect(invalidate).toHaveBeenLastCalledWith({
    queryKey: ['notifications', 'one'],
  });
  invalidate.mockClear();
  act(() => {
    on.mock.calls[0][2]({ eventType: 'UPDATE', new: {} });
    on.mock.calls[0][2]({ eventType: 'UPDATE', new: {} });
    vi.advanceTimersByTime(200);
  });
  expect(invalidate).toHaveBeenCalledTimes(1);
  rerender({ userId: 'two' });
  expect(realtime.removeChannel).toHaveBeenCalledTimes(1);
  expect(on.mock.calls[1][1].filter).toBe('recipient_id=eq.two');
  unmount();
  expect(realtime.removeChannel).toHaveBeenCalledTimes(2);
});

it('invalidates the affected screen for new events but not when merely marking an item read', () => {
  vi.useFakeTimers();
  const on = vi.fn().mockReturnThis();
  const subscribe = vi.fn().mockReturnThis();
  realtime.channel.mockReturnValue({ on, subscribe });
  const cache = createTestQueryClient();
  const invalidate = vi.spyOn(cache, 'invalidateQueries');
  renderHook(() => useNotificationRealtime('me'), {
    wrapper: createTestWrapper(cache),
  });
  act(() => {
    on.mock.calls[0][2]({
      eventType: 'INSERT',
      new: { kind: 'friend.requested' },
    });
    vi.advanceTimersByTime(200);
  });
  expect(invalidate).toHaveBeenCalledWith({ queryKey: ['community', 'me'] });
  expect(invalidate).not.toHaveBeenCalledWith({ queryKey: ['teams', 'me'] });
  invalidate.mockClear();
  act(() => {
    on.mock.calls[0][2]({
      eventType: 'UPDATE',
      new: { kind: 'friend.requested' },
    });
    vi.advanceTimersByTime(200);
  });
  expect(invalidate).toHaveBeenCalledTimes(1);
  expect(invalidate).toHaveBeenCalledWith({
    queryKey: ['notifications', 'me'],
  });
});
