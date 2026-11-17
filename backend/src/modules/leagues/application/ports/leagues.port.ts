import type {
  FixtureScheduleInput,
  LeagueArena,
  LeagueAvailabilityQuery,
  LeagueDetails,
  LeagueInput,
  LeagueMatchInput,
  LeagueResultInput,
  LeagueSummary,
  LeagueTeamInvitationView,
  LeagueUpdateInput,
} from '../../domain/league.js';
export const LEAGUE_USE_CASES = Symbol('LEAGUE_USE_CASES');
export interface LeagueUseCases {
  list(actor: string): Promise<LeagueSummary[]>;
  details(actor: string, leagueId: string): Promise<LeagueDetails>;
  create(actor: string, input: LeagueInput): Promise<LeagueSummary>;
  update(
    actor: string,
    leagueId: string,
    input: LeagueUpdateInput,
  ): Promise<void>;
  registerTeam(actor: string, leagueId: string, teamId: string): Promise<void>;
  inviteTeam(actor: string, leagueId: string, teamId: string): Promise<void>;
  teamInvitations(actor: string): Promise<LeagueTeamInvitationView[]>;
  respondToTeamInvitation(
    actor: string,
    invitationId: string,
    action: 'accept' | 'decline',
  ): Promise<void>;
  removeTeam(actor: string, leagueId: string, teamId: string): Promise<void>;
  arenas(leagueId: string): Promise<LeagueArena[]>;
  availability(
    leagueId: string,
    query: LeagueAvailabilityQuery,
    now: Date,
  ): Promise<{ id: string; horary: string }[]>;
  createMatch(
    actor: string,
    leagueId: string,
    input: LeagueMatchInput,
    clock: () => Date,
  ): Promise<void>;
  recordResult(
    actor: string,
    leagueId: string,
    matchId: string,
    input: LeagueResultInput,
  ): Promise<void>;
  generateFixtures(
    actor: string,
    leagueId: string,
    input: FixtureScheduleInput,
    clock: () => Date,
  ): Promise<void>;
  generateNextRound(
    actor: string,
    leagueId: string,
    input: FixtureScheduleInput,
    clock: () => Date,
  ): Promise<void>;
  rescheduleMatch(
    actor: string,
    leagueId: string,
    matchId: string,
    input: LeagueMatchInput,
    clock: () => Date,
  ): Promise<void>;
  cancelMatch(
    actor: string,
    leagueId: string,
    matchId: string,
    clock: () => Date,
  ): Promise<void>;
  finish(
    actor: string,
    leagueId: string,
    status: 'completed' | 'canceled',
  ): Promise<void>;
}
