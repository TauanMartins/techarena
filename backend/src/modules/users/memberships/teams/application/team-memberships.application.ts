import type { TeamMembershipsRepository } from '../domain/team-memberships-repository.port.js';

import type { PageRequest } from '../../../shared/domain/pagination.js';
import type { ProfileAccess } from '../../../profile/application/profile-access.port.js';
export class TeamMembershipsApplication {
  constructor(
    private readonly repository: TeamMembershipsRepository,
    private readonly profiles: ProfileAccess,
  ) {}
  async teams(id: string, pagination: PageRequest) {
    await this.profiles.ensureExists(id);
    return this.repository.getTeams(id, pagination);
  }
}
