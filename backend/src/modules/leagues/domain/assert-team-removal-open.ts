import { DomainError } from '../../../common/domain/domain-error.js';
export function assertTeamRemovalOpen(
  league: { ownerId: string | null; status: string } | undefined,
) {
  if (!league)
    throw new DomainError('not_found', 'LEAGUE_NOT_FOUND', 'League not found');
  if (league.status !== 'open')
    throw new DomainError(
      'conflict',
      'LEAGUE_REGISTRATION_CLOSED',
      'Teams can only be removed while league registrations are open',
    );

  return league;
}
