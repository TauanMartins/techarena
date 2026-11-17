import type { Page } from '../../../../shared/domain/pagination.js';
import type {
  TeamMembershipQuery,
  TeamSummary,
} from '../../domain/team-membership.js';
export const TEAM_MEMBERSHIPS_REPOSITORY = Symbol(
  'TEAM_MEMBERSHIPS_REPOSITORY',
);
export interface TeamMembershipsRepository {
  getTeams(id: string, query: TeamMembershipQuery): Promise<Page<TeamSummary>>;
}
