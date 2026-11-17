import { DomainError } from '../../../common/domain/domain-error.js';
export function assertLeagueInvitationResponse(
  invitation:
    | {
        leagueId: string;
        leagueStatus: string;
        teamId: string;
        captain: boolean;
        invitationStatus: string;
      }
    | undefined,
) {
  if (!invitation)
    throw new DomainError(
      'not_found',
      'LEAGUE_INVITATION_NOT_FOUND',
      'League invitation not found',
    );
  if (!invitation.captain)
    throw new DomainError(
      'forbidden',
      'LEAGUE_INVITATION_RESPONSE_FORBIDDEN',
      'Only a team captain can respond to this invitation',
    );
  if (invitation.invitationStatus !== 'pending')
    throw new DomainError(
      'conflict',
      'LEAGUE_INVITATION_ALREADY_RESPONDED',
      'This invitation has already been answered',
    );
  if (invitation.leagueStatus !== 'open')
    throw new DomainError(
      'conflict',
      'LEAGUE_REGISTRATION_CLOSED',
      'This league is no longer accepting teams',
    );

  return invitation;
}
