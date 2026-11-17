import { DomainError } from '../../../common/domain/domain-error.js';

export function assertFutureSlot(date: Date, now: Date): void {
  if (date <= now)
    throw new DomainError(
      'conflict',
      'PAST_SLOT',
      'The selected slot has already started',
    );
}
