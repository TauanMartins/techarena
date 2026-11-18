import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { chatApi } from '../api/chat.api';
import { createSupabaseMock } from '../../../test/mocks/supabase';
import { useChatRealtime } from './useChatRealtime';

afterEach(() => vi.restoreAllMocks());

describe('useChatRealtime', () => {
  it('connects, delivers new messages and removes the channel on unmount', async () => {
    const supabase = createSupabaseMock();
    vi.spyOn(chatApi, 'ensureAccess').mockResolvedValue({} as never);
    const onMessage = vi.fn();
    const { result, unmount } = renderHook(() =>
      useChatRealtime({
        client: supabase.client,
        topic: 'team:team-1',
        token: 'token',
        userId: 'user-1',
        displayName: 'Atleta',
        onMessage,
      }),
    );

    await waitFor(() => expect(result.current.connection).toBe('connected'));
    expect(chatApi.ensureAccess).toHaveBeenCalledWith('token', 'team:team-1');
    expect(supabase.client.realtime.setAuth).toHaveBeenCalledWith('token');

    supabase.emit('postgres_changes', 'INSERT', {
      new: {
        id: 'message-1',
        sender_id: 'user-2',
        sender_name: 'Outra pessoa',
        body: 'Olá',
        created_at: '2026-10-29T10:00:00Z',
      },
    });
    expect(onMessage).toHaveBeenCalledWith({
      id: 'message-1',
      userId: 'user-2',
      name: 'Outra pessoa',
      text: 'Olá',
      createdAt: '2026-10-29T10:00:00Z',
    });

    unmount();
    expect(supabase.client.removeChannel).toHaveBeenCalledWith(
      supabase.channel,
    );
  });

  it('stays idle when the client or topic is unavailable', () => {
    const { result } = renderHook(() =>
      useChatRealtime({
        client: null,
        topic: null,
        token: '',
        userId: '',
        displayName: '',
        onMessage: vi.fn(),
      }),
    );
    expect(result.current.connection).toBe('idle');
    expect(result.current.connectedTopic).toBeNull();
  });
});

it('broadcasts typing without message text, throttles and clears the indicator', async () => {
  const supabase = createSupabaseMock();
  vi.spyOn(chatApi, 'ensureAccess').mockResolvedValue({} as never);
  const { result, unmount } = renderHook(() =>
    useChatRealtime({
      client: supabase.client,
      topic: 'team:1',
      token: 'token',
      userId: 'self',
      displayName: 'Eu',
      onMessage: vi.fn(),
    }),
  );
  await waitFor(() => expect(result.current.connection).toBe('connected'));
  act(() => {
    result.current.setTyping(true);
    result.current.setTyping(true);
  });
  expect(supabase.channel.send).toHaveBeenCalledTimes(1);
  expect(supabase.channel.send).toHaveBeenCalledWith(
    expect.objectContaining({
      payload: expect.objectContaining({ typing: true, userId: 'self' }),
    }),
  );
  act(() =>
    supabase.emit('broadcast', 'typing', {
      payload: {
        userId: 'other',
        name: 'Bia',
        image: 'https://example.test/bia.png',
        typing: true,
      },
    }),
  );
  expect(result.current.typingPeople[0]).toMatchObject({
    id: 'other',
    name: 'Bia',
  });
  act(() =>
    supabase.emit('broadcast', 'typing', {
      payload: { userId: 'other', typing: false },
    }),
  );
  expect(result.current.typingPeople).toEqual([]);
  act(() => result.current.setTyping(false));
  expect(supabase.channel.send).toHaveBeenLastCalledWith(
    expect.objectContaining({
      payload: expect.objectContaining({ typing: false }),
    }),
  );
  unmount();
});
