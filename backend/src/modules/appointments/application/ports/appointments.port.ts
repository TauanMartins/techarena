import type { Page } from '../../../../common/domain/pagination.js';
import type {
  AppointmentQuery,
  AvailabilityQuery,
  BookingCard,
  ScheduleItem,
} from '../../domain/appointment.js';
import type {
  BookingContext,
  BookingDraft,
} from '../../domain/booking-policy.js';
export const APPOINTMENTS_REPOSITORY = Symbol('APPOINTMENTS_REPOSITORY');
/** The callback runs within one transaction; the arena is locked before facts are read. */
export interface BookingTransaction {
  context(
    query: AvailabilityQuery,
    scheduleId: string,
  ): Promise<BookingContext>;
  insert(draft: BookingDraft): Promise<BookingCard>;
}
export interface AppointmentsRepository {
  list(
    actor: string,
    query: AppointmentQuery,
    mine: boolean,
  ): Promise<Page<BookingCard>>;
  context(query: AvailabilityQuery): Promise<BookingContext>;
  available(query: AvailabilityQuery, now: Date): Promise<ScheduleItem[]>;
  transaction<T>(work: (store: BookingTransaction) => Promise<T>): Promise<T>;
}
