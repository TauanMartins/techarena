import type { AppointmentsRepository } from './ports/appointments.port.js';
import type { AvailabilityQuery } from '../domain/appointment.js';
import {
  assertBookingVenue,
  assertCalendarDate,
} from '../domain/booking-policy.js';

export class AvailabilityApplication {
  constructor(
    private readonly repository: AppointmentsRepository,
    private readonly now: () => Date = () => new Date(),
  ) {}
  async available(query: AvailabilityQuery) {
    assertCalendarDate(query.date);
    assertBookingVenue(await this.repository.context(query));
    return { items: await this.repository.available(query, this.now()) };
  }
}
