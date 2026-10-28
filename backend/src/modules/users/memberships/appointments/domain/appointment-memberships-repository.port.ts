import type { AppointmentSummary } from './appointment-membership.js';
import type { Page, PageRequest } from '../../../shared/domain/pagination.js';
export const APPOINTMENT_MEMBERSHIPS_REPOSITORY = Symbol(
  'APPOINTMENT_MEMBERSHIPS_REPOSITORY',
);
export interface AppointmentMembershipsRepository {
  getAppointments(
    id: string,
    pagination: PageRequest,
  ): Promise<Page<AppointmentSummary>>;
  joinAppointment(
    id: string,
    appointmentId: string,
    holder: boolean,
    now: Date,
  ): Promise<AppointmentSummary>;
}
