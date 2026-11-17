import { DomainError } from '../../../common/domain/domain-error.js';
export function assertLeagueClosing(
  league:
    { ownerId: string | null; status: string; format: string } | undefined,
  actor: string,
) {
  if (!league)
    throw new DomainError('not_found', 'LEAGUE_NOT_FOUND', 'League not found');
  if (league.ownerId !== actor)
    throw new DomainError(
      'forbidden',
      'LEAGUE_FINISH_FORBIDDEN',
      'Only the organizer can finish this league',
    );
  if (!['open', 'active'].includes(league.status))
    throw new DomainError(
      'conflict',
      'LEAGUE_ALREADY_FINISHED',
      'This league is already closed',
    );

  return league;
}
