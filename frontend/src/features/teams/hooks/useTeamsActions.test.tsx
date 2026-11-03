import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { teamsApi } from '../api/teams.api';
import { createTestQueryClient, createTestWrapper } from '../../../test/test-utils';
import { useTeamsActions } from './useTeamsActions';

afterEach(() => vi.restoreAllMocks());

describe('useTeamsActions', () => {
  it('creates a team, reports success and invalidates team lists', async () => {
    const create = vi.spyOn(teamsApi, 'create').mockResolvedValue({ id: 'team-1' } as never);
    const queryClient = createTestQueryClient();
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useTeamsActions('token', 'user-1'), { wrapper: createTestWrapper(queryClient) });

    await result.current.createTeam({ name: 'Equipe A', description: 'Amigos' });
    expect(create).toHaveBeenCalledWith('token', 'Equipe A', 'Amigos');
    await waitFor(() => expect(result.current.notice).toBe('Equipe criada.'));
    expect(invalidate).toHaveBeenCalledWith(expect.objectContaining({ queryKey: ['teams', 'user-1'] }));
  });

  it('turns API errors into a user-facing action error', async () => {
    vi.spyOn(teamsApi, 'requestToJoin').mockRejectedValue(new Error('Equipe lotada'));
    const { result } = renderHook(() => useTeamsActions('token', 'user-1'), { wrapper: createTestWrapper() });

    await result.current.requestJoin({ id: 'team-1', name: 'Equipe A' });
    await waitFor(() => expect(result.current.error).toBe('Equipe lotada'));
    expect(result.current.notice).toBeNull();
  });
});
