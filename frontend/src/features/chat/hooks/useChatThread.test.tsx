import { act, renderHook, waitFor } from '@testing-library/react';
import type { SubmitEvent } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createTestWrapper } from '../../../test/test-utils';
import {
  createChatMessage,
  loadLatestMessages,
  loadOlderMessages,
} from '../api/message-data';
import { useChatThread } from './useChatThread';

const realtimeState = vi.hoisted(() => ({ connection: 'connected' as string }));
const supabaseState = vi.hoisted(() => ({ client: {} as object }));

vi.mock('../../../lib/supabase-client', () => ({
  supabase: supabaseState.client,
}));
vi.mock('./useChatRealtime', () => ({
  useChatRealtime: ({ topic }: { topic: string | null }) => ({
    connection: realtimeState.connection,
    connectedTopic: realtimeState.connection === 'connected' ? topic : null,
    error: null,
    onlineUserIds: [],
    presenceSynced: true,
    retry: vi.fn(),
    retryCount: 0,
    setTyping: vi.fn(),
    typingPeople: [],
  }),
}));
vi.mock('../api/message-data', () => ({
  createChatMessage: vi.fn(),
  loadLatestMessages: vi.fn(),
  loadOlderMessages: vi.fn(),
}));

const conversation = { id: 'team-1', kind: 'team' as const, label: 'Equipe' };
const initialMessage = {
  id: 'message-1',
  userId: 'other-user',
  name: 'Bia',
  text: 'Olá',
  createdAt: '2026-01-01T00:00:00Z',
};
const submitEvent = {
  preventDefault: vi.fn(),
} as unknown as SubmitEvent<HTMLFormElement>;

describe('useChatThread', () => {
  beforeEach(() => {
    realtimeState.connection = 'connected';
    vi.mocked(loadLatestMessages).mockResolvedValue({
      messages: [initialMessage],
      hasOlderMessages: true,
    });
    vi.mocked(loadOlderMessages).mockResolvedValue({
      messages: [],
      hasOlderMessages: false,
    });
    vi.mocked(createChatMessage).mockResolvedValue({
      ...initialMessage,
      id: 'message-2',
      text: 'Tudo bem?',
    });
  });
  afterEach(() => vi.clearAllMocks());

  it('loads history, ignores blank submissions, sends trimmed text, and clears the draft', async () => {
    const { result } = renderHook(
      () =>
        useChatThread({
          conversation,
          token: 'token',
          userId: 'user-1',
          displayName: 'Ana',
        }),
      { wrapper: createTestWrapper() },
    );
    await waitFor(() =>
      expect(result.current.messages).toEqual([initialMessage]),
    );
    expect(loadLatestMessages).toHaveBeenCalledWith(
      supabaseState.client,
      'team:team-1',
    );

    act(() => result.current.setText('   '));
    await act(() => result.current.sendMessage(submitEvent));
    expect(createChatMessage).not.toHaveBeenCalled();

    act(() => result.current.setText('  Tudo bem?  '));
    await act(() => result.current.sendMessage(submitEvent));
    expect(createChatMessage).toHaveBeenCalledWith(
      supabaseState.client,
      'team:team-1',
      'user-1',
      'Tudo bem?',
    );
    expect(result.current.text).toBe('');
    expect(result.current.messages.map(({ id }) => id)).toEqual([
      'message-1',
      'message-2',
    ]);
  });

  it('loads older pages and reports a user-facing error when the request fails', async () => {
    vi.mocked(loadOlderMessages).mockRejectedValue(new Error('offline'));
    const { result } = renderHook(
      () =>
        useChatThread({
          conversation,
          token: 'token',
          userId: 'user-1',
          displayName: 'Ana',
        }),
      { wrapper: createTestWrapper() },
    );
    await waitFor(() => expect(result.current.messages).toHaveLength(1));
    await act(() => result.current.loadOlderMessages());
    expect(loadOlderMessages).toHaveBeenCalledWith(
      supabaseState.client,
      'team:team-1',
      initialMessage,
    );
    expect(result.current.chatError).toContain('mensagens anteriores');
    expect(result.current.loadingHistory).toBe(false);
  });

  it('does not send while disconnected and safely ignores an absent conversation', async () => {
    realtimeState.connection = 'error';
    const { result, rerender } = renderHook(
      ({ selected }) =>
        useChatThread({
          conversation: selected,
          token: 'token',
          userId: 'user-1',
          displayName: 'Ana',
        }),
      {
        initialProps: {
          selected: conversation as typeof conversation | undefined,
        },
        wrapper: createTestWrapper(),
      },
    );
    act(() => result.current.setText('Mensagem'));
    await act(() => result.current.sendMessage(submitEvent));
    expect(createChatMessage).not.toHaveBeenCalled();
    rerender({ selected: undefined });
    await act(() => result.current.loadOlderMessages());
    expect(loadOlderMessages).not.toHaveBeenCalled();
  });

  it('exposes sending failures as a retryable chat error', async () => {
    vi.mocked(createChatMessage).mockRejectedValue(new Error('write failed'));
    const { result } = renderHook(
      () =>
        useChatThread({
          conversation,
          token: 'token',
          userId: 'user-1',
          displayName: 'Ana',
        }),
      { wrapper: createTestWrapper() },
    );
    await waitFor(() => expect(result.current.messages).toHaveLength(1));
    act(() => result.current.setText('Olá'));
    await act(() => result.current.sendMessage(submitEvent));
    expect(result.current.chatError).toContain('enviar a mensagem');
    expect(result.current.sending).toBe(false);
  });
});
