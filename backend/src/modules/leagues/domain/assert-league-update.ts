import { DomainError } from '../../../common/domain/domain-error.js';
import type { LeagueUpdateInput } from './league.js';
export function assertLeagueUpdate(
  league: { ownerId: string | null; matchCount: number } | undefined,
  actor: string,
  input: LeagueUpdateInput,
) {
  if (!league)
    throw new DomainError('not_found', 'LEAGUE_NOT_FOUND', 'League not found');
  if (league.ownerId !== actor)
    throw new DomainError(
      'forbidden',
      'LEAGUE_UPDATE_FORBIDDEN',
      'Only the organizer can edit this league',
    );
  if (input.status)
    throw new DomainError(
      'invalid',
      'USE_LEAGUE_STATUS_ACTION',
      'Use the league status action to finish or cancel a league',
    );
  const changesTournament =
    input.sportId !== undefined ||
    input.tournamentFormat !== undefined ||
    input.groupCount !== undefined ||
    input.qualifiersPerGroup !== undefined;
  if (Number(league.matchCount) > 0 && changesTournament)
    throw new DomainError(
      'conflict',
      'LEAGUE_HAS_MATCHES',
      'Competition settings cannot change after matches have been scheduled',
    );

  return league;
}
