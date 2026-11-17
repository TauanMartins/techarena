import { DomainError } from '../../../common/domain/domain-error.js';
export function assertRoundGeneration(
  league:
    | {
        ownerId: string | null;
        name: string;
        sportId: string | null;
        status: string;
        format: import('./league.js').LeagueInput['tournamentFormat'];
        groupCount: number;
        qualifiersPerGroup: number;
      }
    | undefined,
  actor: string,
) {
  if (!league)
    throw new DomainError('not_found', 'LEAGUE_NOT_FOUND', 'League not found');
  if (league.ownerId !== actor)
    throw new DomainError(
      'forbidden',
      'LEAGUE_ROUND_FORBIDDEN',
      'Only the organizer can generate a tournament round',
    );
  if (league.status !== 'active')
    throw new DomainError(
      'conflict',
      'LEAGUE_NOT_ACTIVE',
      'The league has no active tournament',
    );
  if (!league.sportId)
    throw new DomainError(
      'conflict',
      'LEAGUE_SPORT_MISSING',
      'The league has no sport configured',
    );

  return { ...league, sportId: league.sportId };
}
