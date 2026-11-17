import type {
  LeagueArena,
  LeagueDetails,
  LeagueSummary,
  LeagueTeamInvitation,
  Schedule,
} from '../../shared/types';
import { apiRequest } from './api-request';
import { queryString } from './query-string';
export const leaguesClient = {
  listLeagues: (token: string) =>
    apiRequest<{ items: LeagueSummary[] }>('/leagues', token),
  getLeague: (token: string, leagueId: string) =>
    apiRequest<LeagueDetails>(`/leagues/${leagueId}`, token),
  createLeague: (
    token: string,
    payload: {
      name: string;
      description?: string;
      sportId: string;
      tournamentFormat: LeagueSummary['tournamentFormat'];
      groupCount?: number;
      qualifiersPerGroup?: number;
    },
  ) =>
    apiRequest<LeagueSummary>('/leagues', token, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateLeague: (
    token: string,
    leagueId: string,
    payload: {
      name?: string;
      description?: string | null;
      sportId?: string;
      tournamentFormat?: LeagueSummary['tournamentFormat'];
      groupCount?: number;
      qualifiersPerGroup?: number;
    },
  ) =>
    apiRequest<{ success: boolean }>(`/leagues/${leagueId}`, token, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  setLeagueStatus: (
    token: string,
    leagueId: string,
    status: 'completed' | 'canceled',
  ) =>
    apiRequest<{ success: boolean }>(`/leagues/${leagueId}/status`, token, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),
  generateLeagueFixtures: (
    token: string,
    leagueId: string,
    payload: {
      arenaId: string;
      scheduleId: string;
      date: string;
      daysBetweenMatches: number;
    },
  ) =>
    apiRequest<{ success: boolean }>(`/leagues/${leagueId}/fixtures`, token, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  generateLeagueNextRound: (
    token: string,
    leagueId: string,
    payload: {
      arenaId: string;
      scheduleId: string;
      date: string;
      daysBetweenMatches: number;
    },
  ) =>
    apiRequest<{ success: boolean }>(
      `/leagues/${leagueId}/rounds/next`,
      token,
      { method: 'POST', body: JSON.stringify(payload) },
    ),
  rescheduleLeagueMatch: (
    token: string,
    leagueId: string,
    matchId: string,
    payload: {
      homeTeamId: string;
      awayTeamId: string;
      arenaId: string;
      scheduleId: string;
      date: string;
    },
  ) =>
    apiRequest<{ success: boolean }>(
      `/leagues/${leagueId}/matches/${matchId}`,
      token,
      { method: 'PUT', body: JSON.stringify(payload) },
    ),
  cancelLeagueMatch: (token: string, leagueId: string, matchId: string) =>
    apiRequest<{ success: boolean }>(
      `/leagues/${leagueId}/matches/${matchId}`,
      token,
      { method: 'DELETE' },
    ),
  registerLeagueTeam: (token: string, leagueId: string, teamId: string) =>
    apiRequest<{ success: boolean }>(`/leagues/${leagueId}/teams`, token, {
      method: 'POST',
      body: JSON.stringify({ teamId }),
    }),
  removeLeagueTeam: (token: string, leagueId: string, teamId: string) =>
    apiRequest<{ success: boolean }>(
      `/leagues/${leagueId}/teams/${teamId}`,
      token,
      { method: 'DELETE' },
    ),
  inviteLeagueTeam: (token: string, leagueId: string, teamId: string) =>
    apiRequest<{ success: boolean }>(
      `/leagues/${leagueId}/team-invitations`,
      token,
      { method: 'POST', body: JSON.stringify({ teamId }) },
    ),
  listLeagueTeamInvitations: (token: string) =>
    apiRequest<{ items: LeagueTeamInvitation[] }>(
      '/leagues/team-invitations',
      token,
    ),
  respondToLeagueTeamInvitation: (
    token: string,
    invitationId: string,
    action: 'accept' | 'decline',
  ) =>
    apiRequest<{ success: boolean }>(
      `/leagues/team-invitations/${invitationId}`,
      token,
      { method: 'PUT', body: JSON.stringify({ action }) },
    ),
  getLeagueArenas: (token: string, leagueId: string) =>
    apiRequest<{ items: LeagueArena[] }>(`/leagues/${leagueId}/arenas`, token),
  getLeagueAvailability: (
    token: string,
    leagueId: string,
    arenaId: string,
    date: string,
  ) =>
    apiRequest<{ items: Schedule[] }>(
      `/leagues/${leagueId}/availability${queryString({ arenaId, date })}`,
      token,
    ),
  createLeagueMatch: (
    token: string,
    leagueId: string,
    payload: {
      homeTeamId: string;
      awayTeamId: string;
      arenaId: string;
      scheduleId: string;
      date: string;
    },
  ) =>
    apiRequest<{ success: boolean }>(`/leagues/${leagueId}/matches`, token, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  recordLeagueResult: (
    token: string,
    leagueId: string,
    matchId: string,
    payload: { homeScore: number; awayScore: number },
  ) =>
    apiRequest<{ success: boolean }>(
      `/leagues/${leagueId}/matches/${matchId}/result`,
      token,
      { method: 'PUT', body: JSON.stringify(payload) },
    ),
};
