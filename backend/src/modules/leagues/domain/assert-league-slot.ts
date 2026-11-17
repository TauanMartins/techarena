import { DomainError } from '../../../common/domain/domain-error.js';
export function assertLeagueSlot(
  available: boolean,
  message = 'The selected arena and time are no longer available',
) {
  if (!available)
    throw new DomainError('conflict', 'ARENA_SLOT_TAKEN', message);
}
