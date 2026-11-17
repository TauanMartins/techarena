import { DomainError } from '../../../../common/domain/domain-error.js';
import type { LeagueAvailabilityQuery } from '../../domain/league.js';
import type { LeagueStore } from '../ports/league-store.port.js';

export async function availability(
  store: LeagueStore,
  leagueId: string,
  query: LeagueAvailabilityQuery,
  now: Date,
) {
  const leagues = await store.queries.availabilityFindLeague(leagueId);
  if (!leagues.length)
    throw new DomainError('not_found', 'LEAGUE_NOT_FOUND', 'League not found');
  if (!leagues[0].sportId)
    throw new DomainError(
      'conflict',
      'LEAGUE_SPORT_MISSING',
      'The league has no sport configured',
    );
  const validArena = await store.queries.availabilityFindCompatibleArena(
    leagueId,
    query.arenaId,
  );
  if (!validArena.length)
    throw new DomainError(
      'invalid',
      'LEAGUE_ARENA_UNAVAILABLE',
      'The selected arena is not available for this league',
    );
  return store.queries.availabilityListAvailableSchedules(
    query.date,
    now,
    query.arenaId,
  );
}
