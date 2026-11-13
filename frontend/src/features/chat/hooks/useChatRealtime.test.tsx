import { renderHook, waitFor } from '@testing-library/react';
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
