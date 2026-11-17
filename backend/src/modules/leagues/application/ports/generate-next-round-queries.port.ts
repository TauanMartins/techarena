import type { LeagueInput } from '../../domain/league.js';
export interface GenerateNextRoundQueries {
  generateNextRoundLockLeague(leagueId: string): Promise<
    {
      ownerId: string | null;
      name: string;
      sportId: string | null;
      status: string;
      format: LeagueInput['tournamentFormat'];
      groupCount: number;
      qualifiersPerGroup: number;
    }[]
  >;
  generateNextRoundLockMatches(leagueId: string): Promise<
    {
      id: string;
      matchNumber: number;
      phase: 'group' | 'knockout' | 'manual';
      roundNumber: number;
      homeTeamId: string;
      awayTeamId: string;
      winnerTeamId: string | null;
    }[]
  >;
  generateNextRoundCountUnresolvedKnockout(
    leagueId: string,
  ): Promise<{ missing: number }[]>;
  generateNextRoundCountUnresolvedGroups(
    leagueId: string,
  ): Promise<{ missing: number }[]>;
  generateNextRoundReadStandings(leagueId: string): Promise<
    {
      teamId: string;
      groupNumber: number;
      points: number;
      wins: number;
      scoreDifference: number;
    }[]
  >;
  generateNextRoundListTeams(leagueId: string): Promise<{ id: string }[]>;
  generateNextRoundFindSport(
    sportId: string,
  ): Promise<{ maxPlayers: number }[]>;
}
