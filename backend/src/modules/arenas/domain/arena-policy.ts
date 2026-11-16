import { DomainError } from '../../../common/domain/domain-error.js';
import { assertGeo } from '../../../common/domain/geo.js';
import type { ArenaInput } from './arena.js';
export function normalizeArena(input: ArenaInput): ArenaInput {
  assertGeo(input);
  if (
    !input.address.trim() ||
    input.address.trim().length > 150 ||
    !input.sportIds.length ||
    new Set(input.sportIds).size !== input.sportIds.length
  )
    throw new DomainError(
      'invalid',
      'INVALID_ARENA',
      'Provide an address and distinct supported sports',
    );
  return { ...input, address: input.address.trim() };
}
export function assertArenaExists(exists: boolean) {
  if (!exists)
    throw new DomainError('not_found', 'ARENA_NOT_FOUND', 'Arena not found');
}
export function planArenaSports(
  existing: string[],
  desired: string[],
  validSports: number,
) {
  if (validSports !== desired.length)
    throw new DomainError(
      'not_found',
      'SPORT_NOT_FOUND',
      'One or more sports do not exist',
    );
  return {
    remove: existing.filter((id) => !desired.includes(id)),
    add: desired.filter((id) => !existing.includes(id)),
  };
}
