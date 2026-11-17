import { DomainError } from '../../../common/domain/domain-error.js';
export function assertMatchCreation(
  league:
    | {
        name: string;
        ownerId: string | null;
        sportId: string | null;
        status: string;
      }
    | undefined,
  actor: string,
) {
  if (!league)
    throw new DomainError('not_found', 'LEAGUE_NOT_FOUND', 'League not found');
  if (league.ownerId !== actor)
    throw new DomainError(
      'forbidden',
      'LEAGUE_MATCH_CREATION_FORBIDDEN',
      'Only the league organizer can schedule matches',
    );
  if (!['open', 'active'].includes(league.status))
    throw new DomainError(
      'conflict',
      'LEAGUE_ALREADY_FINISHED',
      'Matches cannot be scheduled after the league has been closed',
    );
  if (!league.sportId)
    throw new DomainError(
      'conflict',
      'LEAGUE_SPORT_MISSING',
      'The league has no sport configured',
    );

  return { ...league, sportId: league.sportId };
}
