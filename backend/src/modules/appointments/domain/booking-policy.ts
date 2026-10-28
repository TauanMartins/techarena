import { DomainError } from '../../../common/domain/domain-error.js';
export function assertCalendarDate(date: string): void {
  const parsed = new Date(date + 'T00:00:00Z');
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    Number.isNaN(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== date
  )
    throw new DomainError(
      'invalid',
      'INVALID_DATE',
      'Provide a valid YYYY-MM-DD date',
    );
}
export function assertFutureSlot(date: Date, now: Date): void {
  if (date <= now)
    throw new DomainError(
      'conflict',
      'PAST_SLOT',
      'The selected slot has already started',
    );
}
