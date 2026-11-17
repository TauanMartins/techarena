import { DomainError } from '../../../common/domain/domain-error.js';
import type { FixtureScheduleInput } from './league.js';

export function assertFixtureSchedule(input: FixtureScheduleInput) {
  if (
    !Number.isInteger(input.daysBetweenMatches) ||
    input.daysBetweenMatches < 1 ||
    input.daysBetweenMatches > 30
  )
    throw new DomainError(
      'invalid',
      'INVALID_MATCH_INTERVAL',
      'Days between matches must be between 1 and 30',
    );
}
