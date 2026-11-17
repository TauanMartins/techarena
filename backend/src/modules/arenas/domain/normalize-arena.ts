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
