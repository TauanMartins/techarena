import type { LeagueInput } from '../../domain/league.js';
export interface UpdateQueries {
  updateLockLeague(
    leagueId: string,
  ): Promise<{ ownerId: string | null; matchCount: number }[]>;
  updateReadSettings(leagueId: string): Promise<
    {
      tournamentFormat: LeagueInput['tournamentFormat'];
      groupCount: number;
      qualifiersPerGroup: number;
    }[]
  >;
  updateUpdateLeague(
    leagueId: string,
    value2: boolean,
    value3: string | null,
    value4: boolean,
    value5: string | null,
    value6: boolean,
    value7: string | null,
    value8: boolean,
    value9: string | null,
    value10: boolean,
    value11: number | null,
    value12: boolean,
    value13: number | null,
  ): Promise<unknown>;
}
