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

export interface BookingContext {
  arena: {
    id: string;
    isLeagueOnly: boolean;
    lat: number;
    longitude: number;
  } | null;
  sport: { id: string; name: string; defaultPlayers: number } | null;
  supportsSport: boolean;
  schedule: { id: string; horary: string } | null;
}
export interface BookingDraft {
  organizerId: string;
  arenaId: string;
  sportId: string;
  scheduleId: string;
  title: string;
  description: string | null;
  scheduledAt: Date;
  status: 'scheduled';
  maxPlayers: number;
  holder: boolean;
  lat: number;
  longitude: number;
  createdAt: Date;
  updatedAt: Date;
}
export function assertBookingVenue(context: BookingContext) {
  if (!context.arena)
    throw new DomainError('not_found', 'ARENA_NOT_FOUND', 'Arena not found');
  if (context.arena.isLeagueOnly)
    throw new DomainError(
      'forbidden',
      'LEAGUE_ARENA',
      'This arena is restricted to league scheduling',
    );
  if (!context.supportsSport || !context.sport)
    throw new DomainError(
      'not_found',
      'SPORT_ARENA_NOT_FOUND',
      'This arena does not support the sport',
    );
}
export function planBooking(
  actor: string,
  input: import('./appointment.js').CreateAppointment,
  context: BookingContext,
  now: Date,
): BookingDraft {
  assertCalendarDate(input.date);
  assertBookingVenue(context);
  if (!context.schedule)
    throw new DomainError(
      'not_found',
      'SCHEDULE_NOT_FOUND',
      'Schedule not found',
    );
  const scheduledAt = new Date(`${input.date}T${context.schedule.horary}Z`);
  assertFutureSlot(scheduledAt, now);
  const maxPlayers = input.maxPlayers ?? context.sport!.defaultPlayers;
  if (!Number.isSafeInteger(maxPlayers) || maxPlayers < 1 || maxPlayers > 1000)
    throw new DomainError(
      'invalid',
      'INVALID_CAPACITY',
      'Participant capacity must be between 1 and 1000',
    );
  return {
    organizerId: actor,
    arenaId: context.arena!.id,
    sportId: context.sport!.id,
    scheduleId: context.schedule.id,
    scheduledAt,
    status: 'scheduled',
    title: input.title?.trim() || context.sport!.name.slice(0, 100),
    description: input.description ?? null,
    maxPlayers,
    holder: input.holder,
    lat: context.arena!.lat,
    longitude: context.arena!.longitude,
    createdAt: now,
    updatedAt: now,
  };
}
