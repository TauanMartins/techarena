import { renderHook, waitFor, act } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { createTestWrapper } from '../../../test/test-utils';
import { notificationsApi } from '../api/notifications.api';
import { useChatNotificationRead } from './useChatNotificationRead';
afterEach(() => vi.restoreAllMocks());
it('acknowledges only a visible conversation and retries on focus', async () => {
  const visibility = vi
    .spyOn(document, 'visibilityState', 'get')
    .mockReturnValue('hidden');
  const mark = vi
    .spyOn(notificationsApi, 'markConversationRead')
    .mockResolvedValue();
  const { rerender, unmount } = renderHook(
    ({ path }) => useChatNotificationRead('me', path),
    {
      initialProps: { path: '/chat/direct/friend' },
      wrapper: createTestWrapper(),
    },
  );
  expect(mark).not.toHaveBeenCalled();
  visibility.mockReturnValue('visible');
  act(() => document.dispatchEvent(new Event('visibilitychange')));
  await waitFor(() => expect(mark).toHaveBeenCalledWith('/chat/direct/friend'));
  mark.mockClear();
  rerender({ path: '/social' });
  act(() => window.dispatchEvent(new Event('focus')));
  expect(mark).not.toHaveBeenCalled();
  unmount();
});
it('does not interrupt the chat when reading notifications fails', async () => {
  vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
  const mark = vi
    .spyOn(notificationsApi, 'markConversationRead')
    .mockRejectedValue(new Error('offline'));
  renderHook(() => useChatNotificationRead('me', '/chat/team/1'), {
    wrapper: createTestWrapper(),
  });
  await waitFor(() => expect(mark).toHaveBeenCalledTimes(1));
  act(() => window.dispatchEvent(new Event('focus')));
  await waitFor(() => expect(mark).toHaveBeenCalledTimes(2));
});
