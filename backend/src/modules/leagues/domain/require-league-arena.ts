import { DomainError } from '../../../common/domain/domain-error.js';
export function requireLeagueArena<T>(arena: T | undefined) {
  if (!arena)
    throw new DomainError(
      'invalid',
      'LEAGUE_ARENA_UNAVAILABLE',
      'Choose an arena reserved for leagues and supporting this sport',
    );
  return arena;
}
