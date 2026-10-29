export interface LeagueInput {
  name: string;
  description?: string | null;
  sportId: string;
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
}

export interface LeagueMatchView {
  id: string;
  appointmentId: string;
  matchNumber: number;
  scheduledAt: Date;
  status: string;
  resultAllowed: boolean;
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
  matches: LeagueMatchView[];
  standings: LeagueStanding[];
  myCaptainTeamIds: string[];
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

export interface LeagueResultInput {
  homeScore: number;
  awayScore: number;
}

export const LEAGUES_REPOSITORY = Symbol('LEAGUES_REPOSITORY');
export interface LeaguesRepository {
  list(actor: string): Promise<LeagueSummary[]>;
  details(actor: string, leagueId: string): Promise<LeagueDetails>;
  create(actor: string, input: LeagueInput): Promise<LeagueSummary>;
  registerTeam(actor: string, leagueId: string, teamId: string): Promise<void>;
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
}
