import type {
  AppointmentSummary,
  AppointmentMembershipQuery,
} from './appointment-membership.js';
import type { Page } from '../../../shared/domain/pagination.js';
export const APPOINTMENT_MEMBERSHIPS_REPOSITORY = Symbol(
  'APPOINTMENT_MEMBERSHIPS_REPOSITORY',
);
export interface AppointmentMembershipsRepository {
  getAppointments(
    id: string,
    query: AppointmentMembershipQuery,
  ): Promise<Page<AppointmentSummary>>;
  joinAppointment(
    id: string,
    appointmentId: string,
    holder: boolean,
    clock: () => Date,
  ): Promise<AppointmentSummary>;
}
