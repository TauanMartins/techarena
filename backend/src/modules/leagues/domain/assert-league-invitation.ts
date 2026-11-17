import { DomainError } from '../../../common/domain/domain-error.js';
export function assertLeagueInvitation(
  league: { ownerId: string | null; status: string } | undefined,
  actor: string,
) {
  if (!league)
    throw new DomainError('not_found', 'LEAGUE_NOT_FOUND', 'League not found');
  if (league.ownerId !== actor)
    throw new DomainError(
      'forbidden',
      'LEAGUE_INVITATION_FORBIDDEN',
      'Only the league organizer can invite teams',
    );
  if (league.status !== 'open')
    throw new DomainError(
      'conflict',
      'LEAGUE_REGISTRATION_CLOSED',
      'Teams can only be invited while registrations are open',
    );

  return league;
}
