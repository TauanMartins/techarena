import { assertPageRequest } from '../../../shared/domain/pagination.js';
import { APPOINTMENT_STATUSES } from '../domain/appointment-membership.js';
import type { AppointmentMembershipsRepository } from '../domain/appointment-memberships-repository.port.js';

import type { AppointmentMembershipQuery } from '../domain/appointment-membership.js';
import { UserError } from '../../../shared/domain/user-error.js';
import type { ProfileAccess } from '../../../profile/application/profile-access.port.js';
export class AppointmentMembershipsApplication {
  constructor(
    private readonly repository: AppointmentMembershipsRepository,
    private readonly profiles: ProfileAccess,
    private readonly now: () => Date = () => new Date(),
  ) {}
  async appointments(id: string, query: AppointmentMembershipQuery) {
    await this.profiles.ensureExists(id);
    assertPageRequest(query);
    if (
      (query.status !== undefined &&
        !APPOINTMENT_STATUSES.includes(query.status)) ||
      (query.holder !== undefined && typeof query.holder !== 'boolean')
    )
      throw new UserError(
        'invalid',
        'INVALID_APPOINTMENT_QUERY',
        'Invalid appointment filter',
      );
    if (
      (query.from && Number.isNaN(Date.parse(query.from))) ||
      (query.to && Number.isNaN(Date.parse(query.to))) ||
      (query.from && query.to && Date.parse(query.from) > Date.parse(query.to))
    ) {
      throw new UserError(
        'invalid',
        'INVALID_DATE_RANGE',
        'The start date must not be later than the end date',
      );
    }
    return this.repository.getAppointments(id, query);
  }
  async joinAppointment(id: string, appointmentId: string, holder: boolean) {
    await this.profiles.ensureAdult(id);
    return this.repository.joinAppointment(id, appointmentId, holder, this.now);
  }
}
