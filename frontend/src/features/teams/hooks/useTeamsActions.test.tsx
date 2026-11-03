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

  it('guards invitations without a team and completes a captain invite', async () => {
    const invite = vi.spyOn(teamsApi, 'invite').mockResolvedValue({ success: true } as never);
    const { result } = renderHook(() => useTeamsActions('token', 'user-1'), { wrapper: createTestWrapper() });
    const athlete = { id: 'athlete-1', name: null, username: null, image: null };

    await result.current.inviteUser(null, athlete);
    expect(invite).not.toHaveBeenCalled();

    await result.current.inviteUser({ id: 'team-1', name: 'Equipe', description: null, image: null, role: 'captain' }, athlete);
    await waitFor(() => expect(result.current.notice).toBe('Convite enviado para atleta.'));
    expect(invite).toHaveBeenCalledWith('token', 'team-1', 'athlete-1');
    expect(result.current.invitingUserId).toBeNull();
  });

  it('guards request decisions without a team and handles non-Error failures', async () => {
    const decide = vi.spyOn(teamsApi, 'decideRequest').mockRejectedValue('offline');
    const { result } = renderHook(() => useTeamsActions('token', 'user-1'), { wrapper: createTestWrapper() });
    const request = { id: 'request-1', teamId: 'team-1', teamName: 'Equipe', userId: 'athlete-1', userName: null, createdBy: 'captain-1', kind: 'request' as const, status: 'pending' as const, createdAt: '2026-01-01' };

    await result.current.decideTeamRequest(null, request, 'accept');
    expect(decide).not.toHaveBeenCalled();
    await result.current.decideTeamRequest({ id: 'team-1', name: 'Equipe', description: null, image: null, role: 'captain' }, request, 'decline');
    await waitFor(() => expect(result.current.error).toBe('Não foi possível concluir a operação.'));
    expect(decide).toHaveBeenCalledWith('token', 'team-1', 'athlete-1', 'decline');
  });
});
