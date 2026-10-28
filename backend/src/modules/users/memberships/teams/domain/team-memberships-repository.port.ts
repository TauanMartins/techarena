import type { TeamSummary, TeamMembershipQuery } from './team-membership.js';
import type { Page } from '../../../shared/domain/pagination.js';
export const TEAM_MEMBERSHIPS_REPOSITORY = Symbol(
  'TEAM_MEMBERSHIPS_REPOSITORY',
);
export interface TeamMembershipsRepository {
  getTeams(id: string, query: TeamMembershipQuery): Promise<Page<TeamSummary>>;
}
