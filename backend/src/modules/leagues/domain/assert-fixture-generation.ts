import { DomainError } from '../../../common/domain/domain-error.js';
export function assertFixtureGeneration(
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
      'LEAGUE_FIXTURES_FORBIDDEN',
      'Only the organizer can generate fixtures',
    );
  if (league.status !== 'open')
    throw new DomainError(
      'conflict',
      'LEAGUE_NOT_OPEN',
      'Fixtures can only be generated for an open league',
    );
  if (!league.sportId)
    throw new DomainError(
      'conflict',
      'LEAGUE_SPORT_MISSING',
      'The league has no sport configured',
    );

  return { ...league, sportId: league.sportId };
}
