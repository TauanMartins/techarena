import type { Page } from '../../../../shared/domain/pagination.js';
import type {
  AppointmentMembershipQuery,
  AppointmentSummary,
} from '../../domain/appointment-membership.js';
export const APPOINTMENT_MEMBERSHIPS_REPOSITORY = Symbol(
  'APPOINTMENT_MEMBERSHIPS_REPOSITORY',
);
export interface AppointmentMembershipsRepository {
  getAppointments(
    id: string,
    query: AppointmentMembershipQuery,
  ): Promise<Page<AppointmentSummary>>;
  transaction<T>(
    work: (store: AppointmentAdmissionStore) => Promise<T>,
  ): Promise<T>;
}
export interface AppointmentAdmissionStore {
  lock(
    userId: string,
    appointmentId: string,
    holder: boolean,
  ): Promise<{
    admission: import('../../domain/appointment-membership.js').AppointmentAdmission;
    summary: AppointmentSummary;
  } | null>;
  insert(userId: string, appointmentId: string, holder: boolean): Promise<void>;
}
