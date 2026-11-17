import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { teamsApi } from '../api/teams.api';
import type { TeamOverview } from '../components/TeamDetailsModal';
import { useTeamsData } from './useTeamsData';

describe('useTeamsData', () => {
  const emptyPage = {
    items: [],
    total: 0,
    totalPages: 0,
    page: 1,
    limit: 20,
    hasNextPage: false,
    hasPreviousPage: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads team catalog and user data, and enables captain-only details', async () => {
    vi.spyOn(teamsApi, 'list').mockResolvedValue(emptyPage);
    vi.spyOn(teamsApi, 'listMine').mockResolvedValue(emptyPage);
    vi.spyOn(teamsApi, 'listRequests').mockResolvedValue(emptyPage);
    vi.spyOn(teamsApi, 'listMembers').mockResolvedValue(emptyPage);
    vi.spyOn(teamsApi, 'listTeamRequests').mockResolvedValue(emptyPage);
    vi.spyOn(teamsApi, 'searchUsers').mockResolvedValue(emptyPage);

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children);
    const team: TeamOverview = {
      id: 'team-1',
      name: 'Equipe',
      description: null,
      image: null,
      role: 'captain',
    };

    const { result } = renderHook(
      () =>
        useTeamsData({
          token: 'access-token',
          userId: 'user-1',
          catalogSearch: 'atletas',
          selectedTeam: team,
          inviteSearch: 'ana',
        }),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isLoadingDetails).toBe(false);
    });
    expect(teamsApi.list).toHaveBeenCalledWith('access-token', 'atletas', 1);
    expect(teamsApi.listMembers).toHaveBeenCalledWith('access-token', 'team-1');
    expect(teamsApi.listTeamRequests).toHaveBeenCalledWith(
      'access-token',
      'team-1',
    );
    expect(teamsApi.searchUsers).toHaveBeenCalledWith('access-token', 'ana');

    queryClient.clear();
  });
});

it('does not browse a global catalog and paginates only an explicit name search', async () => {
  const empty = {
    items: [],
    total: 0,
    totalPages: 0,
    page: 1,
    limit: 20,
    hasNextPage: false,
    hasPreviousPage: false,
  };
  const list = vi.spyOn(teamsApi, 'list').mockResolvedValue(empty);
  list.mockClear();
  vi.spyOn(teamsApi, 'listMine').mockResolvedValue(empty);
  vi.spyOn(teamsApi, 'listRequests').mockResolvedValue(empty);
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client }, children);
  const { result, rerender } = renderHook(
    ({ search, page }) =>
      useTeamsData({
        token: 'token',
        userId: 'user',
        catalogSearch: search,
        catalogPage: page,
        selectedTeam: null,
        inviteSearch: '',
      }),
    { wrapper, initialProps: { search: '', page: 1 } },
  );
  await waitFor(() => expect(result.current.isLoading).toBe(false));
  expect(list).not.toHaveBeenCalled();
  rerender({ search: 'a', page: 1 });
  expect(list).not.toHaveBeenCalled();
  rerender({ search: 'aurora', page: 1 });
  await waitFor(() => expect(list).toHaveBeenCalledWith('token', 'aurora', 1));
  rerender({ search: 'aurora', page: 2 });
  await waitFor(() => expect(list).toHaveBeenCalledWith('token', 'aurora', 2));
  client.clear();
});
