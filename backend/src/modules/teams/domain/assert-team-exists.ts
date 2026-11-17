import { DomainError } from '../../../common/domain/domain-error.js';

export function assertTeamExists(team: unknown): asserts team {
  if (!team)
    throw new DomainError('not_found', 'TEAM_NOT_FOUND', 'Team not found');
}
