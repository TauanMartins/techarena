import type { LeagueInput } from '../../domain/league.js';
export interface GenerateFixturesQueries {
  generateFixturesLockLeague(leagueId: string): Promise<
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
  generateFixturesFindExistingMatches(
    leagueId: string,
  ): Promise<{ id: string }[]>;
  generateFixturesListTeams(leagueId: string): Promise<{ id: string }[]>;
  generateFixturesAssignGroup(
    leagueId: string,
    teamId: string,
    value3: number,
  ): Promise<unknown>;
  generateFixturesFindSport(sportId: string): Promise<{ maxPlayers: number }[]>;
  generateFixturesActivateLeague(leagueId: string): Promise<unknown>;
}
