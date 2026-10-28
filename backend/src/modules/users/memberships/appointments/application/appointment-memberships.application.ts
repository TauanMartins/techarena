import type { AppointmentMembershipsRepository } from '../domain/appointment-memberships-repository.port.js';

import type { PageRequest } from '../../../shared/domain/pagination.js';
import type { ProfileAccess } from '../../../profile/application/profile-access.port.js';
export class AppointmentMembershipsApplication {
  constructor(
    private readonly repository: AppointmentMembershipsRepository,
    private readonly profiles: ProfileAccess,
    private readonly now: () => Date = () => new Date(),
  ) {}
  async appointments(id: string, pagination: PageRequest) {
    await this.profiles.ensureExists(id);
    return this.repository.getAppointments(id, pagination);
  }
  async joinAppointment(id: string, appointmentId: string, holder: boolean) {
    await this.profiles.ensureAdult(id);
    return this.repository.joinAppointment(
      id,
      appointmentId,
      holder,
      this.now(),
    );
  }
}
