import { DomainError } from '../../../common/domain/domain-error.js';

import { BookingContext } from './booking-policy-types.js';
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
