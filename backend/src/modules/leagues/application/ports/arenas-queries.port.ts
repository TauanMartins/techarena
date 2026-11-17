import type { LeagueArena } from '../../domain/league.js';
export interface ArenasQueries {
  arenasListCompatibleArenas(leagueId: string): Promise<LeagueArena[]>;
  arenasFindLeague(leagueId: string): Promise<{ id: string }[]>;
}
