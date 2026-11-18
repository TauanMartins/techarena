import {
  act,
  renderHook,
  waitFor,
  render,
  screen,
  fireEvent,
} from '@testing-library/react';
import type { SubmitEvent } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createTestQueryClient,
  createTestWrapper,
} from '../../../test/test-utils';
import { leaguesApi } from '../api/leagues.api';
import { useLeaguesData } from './useLeaguesData';
import { useLeagueWorkspace } from './useLeagueWorkspace';

vi.mock('./useLeaguesData', () => ({ useLeaguesData: vi.fn() }));

const league = {
  id: 'league-1',
  name: 'Liga',
  description: null,
  image: null,
  ownerId: 'user-1',
  ownerName: 'Ana',
  sportId: 'sport-1',
  sportName: 'Futebol',
  tournamentFormat: 'round_robin',
  status: 'open',
  groupCount: 2,
  qualifiersPerGroup: 2,
  createdAt: '2026-01-01',
  teamCount: 2,
  matchCount: 1,
  completedMatchCount: 0,
  isOwner: true,
};
const match = {
  id: 'match-1',
  homeTeam: { id: 'home', name: 'Casa' },
  awayTeam: { id: 'away', name: 'Fora' },
  result: null,
};
const details = {
  league,
  teams: [],
  invitations: [],
  matches: [match],
  standings: [],
  myCaptainTeamIds: [],
};

function mockWorkspace(withDetails = true) {
  vi.mocked(useLeaguesData).mockReturnValue({
    leagues: [league],
    selectedLeagueId: 'league-1',
    sports: [],
    myTeams: [],
    teamInvitations: [],
    teamSearchResults: [],
    details: withDetails ? details : null,
    leagueArenas: [],
    selectedArenaId: 'arena-1',
    availability: [],
    isLoading: false,
    isLoadingDetails: false,
    isSearchingTeams: false,
    error: null,
    invalidateCatalog: vi.fn(),
    invalidateDetails: vi.fn(),
  } as never);
}

function eventFor(
  values: Record<string, string> = {},
): SubmitEvent<HTMLFormElement> {
  const form = document.createElement('form');
  for (const [name, value] of Object.entries(values)) {
    const input = document.createElement('input');
    input.name = name;
    input.value = value;
    form.append(input);
  }
  return {
    preventDefault: vi.fn(),
    currentTarget: form,
  } as unknown as SubmitEvent<HTMLFormElement>;
}

describe('useLeagueWorkspace', () => {
  beforeEach(() => mockWorkspace());
  afterEach(() => vi.restoreAllMocks());

  it('rejects invalid create payloads, creates a league, and clears search state', async () => {
    const create = vi
      .spyOn(leaguesApi, 'create')
      .mockResolvedValue({ id: 'new-league' } as never);
    const queryClient = createTestQueryClient();
    const invalidate = vi
      .spyOn(queryClient, 'invalidateQueries')
      .mockResolvedValue(true as never);
    const { result } = renderHook(() => useLeagueWorkspace('token', 'user-1'), {
      wrapper: createTestWrapper(queryClient),
    });

    await act(() =>
      result.current.createLeague(eventFor({ name: '', sportId: '' })),
    );
    expect(result.current.error).toBeTruthy();
    expect(create).not.toHaveBeenCalled();

    await act(() =>
      result.current.createLeague(
        eventFor({
          name: ' Liga nova ',
          sportId: 'sport-1',
          tournamentFormat: 'round_robin',
        }),
      ),
    );
    expect(create).toHaveBeenCalledWith(
      'token',
      expect.objectContaining({ name: 'Liga nova', sportId: 'sport-1' }),
    );
    expect(result.current.notice).toContain('Liga criada');
    expect(invalidate).toHaveBeenCalled();

    act(() => {
      result.current.setTeamSearch('  equipe  ');
    });
    act(() => result.current.searchTeams(eventFor()));
    expect(result.current.submittedTeamSearch).toBe('equipe');
    expect(result.current.teamSearchPerformed).toBe(true);
    expect(result.current.inviteTeamId).toBe('');
  });

  it('respects confirmation guards and handles failed league mutations', async () => {
    const update = vi
      .spyOn(leaguesApi, 'update')
      .mockRejectedValue(new Error('permission denied'));
    const setStatus = vi
      .spyOn(leaguesApi, 'setStatus')
      .mockResolvedValue({ success: true } as never);
    vi.stubGlobal('confirm', vi.fn().mockReturnValue(false));
    const { result } = renderHook(() => useLeagueWorkspace('token', 'user-1'), {
      wrapper: createTestWrapper(),
    });

    await act(() =>
      result.current.updateLeague(
        eventFor({ name: 'Liga editada', tournamentFormat: 'round_robin' }),
      ),
    );
    await waitFor(() => expect(result.current.error).toBe('permission denied'));
    expect(update).toHaveBeenCalledWith('token', 'league-1', {
      name: 'Liga editada',
      description: null,
    });
    await act(() => result.current.updateStatus('canceled'));
    expect(setStatus).not.toHaveBeenCalled();

    await act(() => result.current.updateStatus('completed'));
    render(result.current.confirmationDialog);
    fireEvent.click(screen.getByRole('button', { name: 'Encerrar liga' }));
    await waitFor(() =>
      expect(setStatus).toHaveBeenCalledWith('token', 'league-1', 'completed'),
    );
    expect(result.current.notice).toBe('Liga encerrada.');
  });

  it('validates scores, records valid results and guards operations without details', async () => {
    const record = vi
      .spyOn(leaguesApi, 'recordResult')
      .mockResolvedValue({ success: true } as never);
    const { result, rerender } = renderHook(
      () => useLeagueWorkspace('token', 'user-1'),
      { wrapper: createTestWrapper() },
    );
    await act(() => result.current.saveResult(match as never));
    expect(result.current.error).toBeTruthy();
    expect(record).not.toHaveBeenCalled();

    act(() =>
      result.current.setScoreInputs({ 'match-1': { home: '2', away: '1' } }),
    );
    await act(() => result.current.saveResult(match as never));
    expect(record).toHaveBeenCalledWith('token', 'league-1', 'match-1', {
      homeScore: 2,
      awayScore: 1,
    });

    mockWorkspace(false);
    rerender();
    await act(() => result.current.removeTeam('team-1'));
    expect(result.current.data.details).toBeNull();
  });
});
