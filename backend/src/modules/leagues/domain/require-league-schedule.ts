import { DomainError } from '../../../common/domain/domain-error.js';
export function requireLeagueSchedule<T>(schedule: T | undefined) {
  if (!schedule)
    throw new DomainError(
      'not_found',
      'SCHEDULE_NOT_FOUND',
      'Schedule not found',
    );
  return schedule;
}
