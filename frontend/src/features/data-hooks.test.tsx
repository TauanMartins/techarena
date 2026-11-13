import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  appointmentApi,
  useAppointments,
  useJoinAppointment,
} from './appointments/api/appointments.api';
import { chatApi, useChatConversations } from './chat/api/chat.api';
import {
  communityApi,
  useFriendMutations,
  useFriendGroups,
} from './community/api/community.api';
import {
  leaguesApi,
  useLeagueCatalog,
  useLeagueMutation,
} from './leagues/api/leagues.api';
import {
  settingsApi,
  useSettingsData,
  useSaveFavoriteSports,
} from './settings/api/settings.api';
import { teamsApi, useTeamCatalog, useCreateTeam } from './teams/api/teams.api';
import { createTestQueryClient, createTestWrapper } from '../test/test-utils';
import { apiError, spyOnApiMethod } from '../test/mocks/nest-api';

const emptyPage = {
  items: [],
  total: 0,
  totalPages: 0,
  page: 1,
  limit: 20,
  hasNextPage: false,
  hasPreviousPage: false,
};

afterEach(() => vi.restoreAllMocks());

describe('feature data hooks', () => {
  it('loads appointments with the active user and list filters', async () => {
    const list = spyOnApiMethod(appointmentApi, 'list').mockResolvedValue(
      emptyPage as never,
    );
    const { result } = renderHook(
      () => useAppointments('token', 'user-1', { page: 2 }),
      { wrapper: createTestWrapper() },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(list).toHaveBeenCalledWith('token', { page: 2 });
  });

  it('reports API failures without retrying and preserves the error', async () => {
    for (const status of [400, 401, 500]) {
      const failure = apiError(status, `HTTP ${status}`);
      vi.spyOn(appointmentApi, 'list').mockRejectedValueOnce(failure);
      const { result } = renderHook(
        () => useAppointments('bad-token', `user-${status}`),
        { wrapper: createTestWrapper() },
      );
      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error).toBe(failure);
    }
  });

  it('invalidates appointment queries after joining', async () => {
    const join = vi
      .spyOn(appointmentApi, 'join')
      .mockResolvedValue({} as never);
    const queryClient = createTestQueryClient();
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useJoinAppointment('token', 'user-1'), {
      wrapper: createTestWrapper(queryClient),
    });
    await result.current.mutateAsync('appointment-1');
    expect(join).toHaveBeenCalledWith('token', 'appointment-1');
    expect(invalidate).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['appointments', 'user-1'] }),
    );
  });

  it('combines chat sources into a conversation list', async () => {
    vi.spyOn(chatApi, 'friends').mockResolvedValue({
      friends: emptyPage,
      requestedFriends: emptyPage,
      receivedFriends: emptyPage,
    } as never);
    vi.spyOn(chatApi, 'teams').mockResolvedValue(emptyPage as never);
    vi.spyOn(chatApi, 'appointments').mockResolvedValue(emptyPage as never);
    const { result } = renderHook(
      () => useChatConversations('token', 'user-1'),
      { wrapper: createTestWrapper() },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });

  it('loads friend groups and refreshes them after a friend decision', async () => {
    const list = vi
      .spyOn(communityApi, 'listFriends')
      .mockResolvedValue({} as never);
    const decide = vi
      .spyOn(communityApi, 'decideFriend')
      .mockResolvedValue({} as never);
    const queryClient = createTestQueryClient();
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    const wrapper = createTestWrapper(queryClient);
    const { result } = renderHook(
      () => ({
        groups: useFriendGroups('token', 'user-1'),
        actions: useFriendMutations('token', 'user-1'),
      }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.groups.isSuccess).toBe(true));
    await result.current.actions.decide.mutateAsync({
      friendId: 'friend-1',
      action: 'accept',
    });
    expect(list).toHaveBeenCalledWith('token');
    expect(decide).toHaveBeenCalledWith('token', 'friend-1', 'accept');
    expect(invalidate).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['community', 'user-1'] }),
    );
  });

  it('loads leagues and invalidates catalog and details after a league mutation', async () => {
    vi.spyOn(leaguesApi, 'list').mockResolvedValue(emptyPage as never);
    const create = vi.fn().mockResolvedValue({ id: 'league-1' });
    const queryClient = createTestQueryClient();
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    const wrapper = createTestWrapper(queryClient);
    const { result } = renderHook(
      () => ({
        catalog: useLeagueCatalog('token', 'user-1'),
        mutation: useLeagueMutation('token', 'user-1', create),
      }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.catalog.isSuccess).toBe(true));
    await result.current.mutation.mutateAsync({ name: 'Liga' });
    expect(create).toHaveBeenCalledWith('token', { name: 'Liga' });
    expect(invalidate).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['leagues', 'user-1'] }),
    );
    expect(invalidate).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['leagueDetails', 'user-1'] }),
    );
  });

  it('loads settings and invalidates them when favorite sports change', async () => {
    vi.spyOn(settingsApi, 'sports').mockResolvedValue(emptyPage as never);
    vi.spyOn(settingsApi, 'favorites').mockResolvedValue({
      items: [],
      maxFavorites: 5,
    } as never);
    const replace = vi
      .spyOn(settingsApi, 'replaceFavorites')
      .mockResolvedValue({} as never);
    const queryClient = createTestQueryClient();
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    const wrapper = createTestWrapper(queryClient);
    const { result } = renderHook(
      () => ({
        query: useSettingsData('token', 'user-1'),
        save: useSaveFavoriteSports('token', 'user-1'),
      }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.query.isSuccess).toBe(true));
    await result.current.save.mutateAsync(['sport-1']);
    expect(replace).toHaveBeenCalledWith('token', ['sport-1']);
    expect(invalidate).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['settings', 'user-1'] }),
    );
  });

  it('loads the team catalog and invalidates team data after creation', async () => {
    vi.spyOn(teamsApi, 'list').mockResolvedValue(emptyPage as never);
    const create = vi.spyOn(teamsApi, 'create').mockResolvedValue({} as never);
    const queryClient = createTestQueryClient();
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    const wrapper = createTestWrapper(queryClient);
    const { result } = renderHook(
      () => ({
        catalog: useTeamCatalog('token', 'user-1'),
        create: useCreateTeam('token', 'user-1'),
      }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.catalog.isSuccess).toBe(true));
    await result.current.create.mutateAsync({ name: 'Equipe' });
    expect(create).toHaveBeenCalledWith('token', 'Equipe', undefined);
    expect(invalidate).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['teams', 'user-1'] }),
    );
  });
});
