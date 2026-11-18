import { venueTime } from '../../../common/domain/venue-time.js';
import { DomainError } from '../../../common/domain/domain-error.js';
import { assertBookingVenue } from './assert-booking-venue.js';
import { assertCalendarDate } from './assert-calendar-date.js';
import { assertFutureSlot } from './assert-future-slot.js';
import { BookingContext, BookingDraft } from './booking-policy-types.js';
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
  const scheduledAt = venueTime(input.date, context.schedule.horary);
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
