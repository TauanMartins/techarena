import { DomainError } from '../../../common/domain/domain-error.js';
export function assertInvitableTeam(
  team: { exists: boolean; hasCaptain: boolean } | undefined,
) {
  if (!team?.exists)
    throw new DomainError('not_found', 'TEAM_NOT_FOUND', 'Team not found');
  if (!team.hasCaptain)
    throw new DomainError(
      'conflict',
      'TEAM_HAS_NO_CAPTAIN',
      'This team has no captain who can respond to the invitation',
    );
}
