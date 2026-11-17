import { DomainError } from '../../../common/domain/domain-error.js';
export function assertTeamRemoval(
  league: { ownerId: string | null },
  membership: { registered: boolean; captain: boolean; hasMatches: boolean },
  actor: string,
) {
  if (!membership.registered)
    throw new DomainError(
      'not_found',
      'LEAGUE_TEAM_NOT_FOUND',
      'League team not found',
    );
  if (league.ownerId !== actor && !membership.captain)
    throw new DomainError(
      'forbidden',
      'LEAGUE_TEAM_REMOVAL_FORBIDDEN',
      'Only the league organizer or a team captain can remove a team',
    );
  if (membership.hasMatches)
    throw new DomainError(
      'conflict',
      'LEAGUE_TEAM_HAS_MATCHES',
      'A team with scheduled matches cannot be removed',
    );
}
