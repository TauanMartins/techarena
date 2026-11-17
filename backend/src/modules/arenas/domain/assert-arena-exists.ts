import { DomainError } from '../../../common/domain/domain-error.js';

export function assertArenaExists(exists: boolean) {
  if (!exists)
    throw new DomainError('not_found', 'ARENA_NOT_FOUND', 'Arena not found');
}
