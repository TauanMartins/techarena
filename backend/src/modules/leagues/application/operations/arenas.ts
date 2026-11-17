import { DomainError } from '../../../../common/domain/domain-error.js';
import type { LeagueStore } from '../ports/league-store.port.js';

export async function arenas(store: LeagueStore, leagueId: string) {
  const rows = await store.queries.arenasListCompatibleArenas(leagueId);
  if (!rows.length) {
    const exists = await store.queries.arenasFindLeague(leagueId);
    if (!exists.length)
      throw new DomainError(
        'not_found',
        'LEAGUE_NOT_FOUND',
        'League not found',
      );
  }
  return rows;
}
