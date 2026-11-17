import { DomainError } from '../../../common/domain/domain-error.js';
export interface RegistrationContext {
  ownerId: string | null;
  sportId: string | null;
  status: string;
  registered: boolean;
  captain: boolean;
}
export function assertTeamRegistration(
  league: RegistrationContext | undefined,
  actor: string,
) {
  if (!league)
    throw new DomainError('not_found', 'LEAGUE_NOT_FOUND', 'League not found');
  if (!league.ownerId || !league.sportId)
    throw new DomainError(
      'conflict',
      'LEAGUE_NOT_CONFIGURED',
      'This legacy league is missing its organizer or sport',
    );
  if (league.status !== 'open')
    throw new DomainError(
      'conflict',
      'LEAGUE_REGISTRATION_CLOSED',
      'Teams can only be registered while league registrations are open',
    );
  if (league.registered)
    throw new DomainError(
      'conflict',
      'TEAM_ALREADY_REGISTERED',
      'This team is already registered',
    );
  if (league.ownerId !== actor && !league.captain)
    throw new DomainError(
      'forbidden',
      'LEAGUE_TEAM_REGISTRATION_FORBIDDEN',
      'Only the league organizer or a team captain can register a team',
    );
}
