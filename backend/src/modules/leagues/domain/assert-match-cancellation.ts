import { DomainError } from '../../../common/domain/domain-error.js';
export function assertMatchCancellation(
  match:
    | {
        ownerId: string | null;
        leagueStatus: string;
        appointmentId: string;
        status: string;
        scheduledAt: Date;
        hasResult: boolean;
        phase: string;
      }
    | undefined,
  actor: string,
  now: Date,
) {
  if (!match)
    throw new DomainError(
      'not_found',
      'LEAGUE_MATCH_NOT_FOUND',
      'Match not found',
    );
  if (match.ownerId !== actor)
    throw new DomainError(
      'forbidden',
      'LEAGUE_MATCH_CANCEL_FORBIDDEN',
      'Only the organizer can cancel this match',
    );
  if (!['open', 'active'].includes(match.leagueStatus))
    throw new DomainError(
      'conflict',
      'LEAGUE_ALREADY_FINISHED',
      'Matches cannot be changed after the league has been closed',
    );
  if (match.phase !== 'manual')
    throw new DomainError(
      'conflict',
      'TOURNAMENT_MATCH_CANNOT_BE_CANCELED',
      'Tournament fixtures must be rescheduled or the league canceled to preserve the bracket',
    );
  if (
    match.status !== 'scheduled' ||
    match.hasResult ||
    new Date(match.scheduledAt) <= now
  )
    throw new DomainError(
      'conflict',
      'LEAGUE_MATCH_NOT_CANCELLABLE',
      'Only future matches without results can be canceled',
    );

  return match;
}
