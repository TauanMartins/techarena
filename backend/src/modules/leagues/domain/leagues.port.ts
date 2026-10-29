export interface LeagueInput {
  name: string;
  description?: string | null;
  sportId: string;
  tournamentFormat: TournamentFormat;
  groupCount?: number;
  qualifiersPerGroup?: number;
}

export type TournamentFormat = 'round_robin' | 'knockout' | 'groups_knockout';

export type TournamentStatus = 'open' | 'active' | 'completed' | 'canceled';

export interface LeagueUpdateInput {
  name?: string;
  description?: string | null;
  sportId?: string;
  tournamentFormat?: TournamentFormat;
  groupCount?: number;
  qualifiersPerGroup?: number;
  status?: 'completed' | 'canceled';
}

export interface LeagueSummary {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
  ownerId: string | null;
  ownerName: string | null;
  sportId: string | null;
  sportName: string | null;
  tournamentFormat: TournamentFormat;
  status: TournamentStatus;
  groupCount: number;
  qualifiersPerGroup: number;
  createdAt: Date;
  teamCount: number;
  matchCount: number;
  completedMatchCount: number;
  isOwner: boolean;
}

export interface LeagueTeamView {
  id: string;
  name: string;
  image: string | null;
  captainName: string | null;
  groupNumber: number | null;
}

export interface LeagueMatchView {
  id: string;
  appointmentId: string;
  matchNumber: number;
  scheduledAt: Date;
  status: string;
  resultAllowed: boolean;
  phase: 'manual' | 'group' | 'knockout';
  roundNumber: number;
  groupNumber: number | null;
  arenaAddress: string | null;
  homeTeam: LeagueTeamView;
  awayTeam: LeagueTeamView;
  result: {
    winnerTeamId: string | null;
    homeScore: number;
    awayScore: number;
  } | null;
}

export interface LeagueStanding {
  teamId: string;
  teamName: string;
  image: string | null;
  groupNumber: number | null;
  played: number;
  wins: number;
  losses: number;
  draws: number;
  points: number;
  scoreFor: number;
  scoreAgainst: number;
}

export interface LeagueDetails {
  league: LeagueSummary;
  teams: LeagueTeamView[];
  invitations: LeagueTeamInvitationView[];
  matches: LeagueMatchView[];
  standings: LeagueStanding[];
  myCaptainTeamIds: string[];
}

export interface LeagueTeamInvitationView {
  id: string;
  leagueId: string;
  leagueName: string;
  teamId: string;
  teamName: string;
  invitedAt: Date;
}

export interface LeagueArena {
  id: string;
  address: string;
  image: string | null;
}

export interface LeagueAvailabilityQuery {
  arenaId: string;
  date: string;
}

export interface LeagueMatchInput extends LeagueAvailabilityQuery {
  homeTeamId: string;
  awayTeamId: string;
  scheduleId: string;
}

export interface FixtureScheduleInput {
  arenaId: string;
  scheduleId: string;
  date: string;
  daysBetweenMatches: number;
}

export interface LeagueResultInput {
  homeScore: number;
  awayScore: number;
}

export const LEAGUES_REPOSITORY = Symbol('LEAGUES_REPOSITORY');
export interface LeaguesRepository {
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
    now: Date,
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
    now: Date,
  ): Promise<void>;
  generateNextRound(
    actor: string,
    leagueId: string,
    input: FixtureScheduleInput,
    now: Date,
  ): Promise<void>;
  rescheduleMatch(
    actor: string,
    leagueId: string,
    matchId: string,
    input: LeagueMatchInput,
    now: Date,
  ): Promise<void>;
  cancelMatch(
    actor: string,
    leagueId: string,
    matchId: string,
    now: Date,
  ): Promise<void>;
  finish(
    actor: string,
    leagueId: string,
    status: 'completed' | 'canceled',
  ): Promise<void>;
}
