import type { TeamSummary } from './team-membership.js';
import type { Page, PageRequest } from '../../../shared/domain/pagination.js';
export const TEAM_MEMBERSHIPS_REPOSITORY = Symbol(
  'TEAM_MEMBERSHIPS_REPOSITORY',
);
export interface TeamMembershipsRepository {
  getTeams(id: string, pagination: PageRequest): Promise<Page<TeamSummary>>;
}
