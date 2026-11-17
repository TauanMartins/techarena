import { assertPageRequest } from '../../../shared/domain/pagination.js';
import { UserError } from '../../../shared/domain/user-error.js';
import type { TeamMembershipsRepository } from './ports/team-memberships-repository.port.js';

import type { ProfileAccess } from '../../../profile/application/ports/profile-access.port.js';
import type { TeamMembershipQuery } from '../domain/team-membership.js';
export class TeamMembershipsApplication {
  constructor(
    private readonly repository: TeamMembershipsRepository,
    private readonly profiles: ProfileAccess,
  ) {}
  async teams(id: string, query: TeamMembershipQuery) {
    await this.profiles.ensureExists(id);
    assertPageRequest(query);
    const search = query.search?.trim();
    if (
      (search !== undefined && (search.length < 2 || search.length > 100)) ||
      (query.role !== undefined &&
        !['captain', 'member'].includes(query.role)) ||
      !['joinedAt', 'name'].includes(query.sortBy)
    )
      throw new UserError(
        'invalid',
        'INVALID_TEAM_QUERY',
        'Invalid team filter or sorting options',
      );
    return this.repository.getTeams(id, { ...query, search });
  }
}
