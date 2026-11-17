import { DomainError } from '../../../common/domain/domain-error.js';
export function assertLeagueCompletion(
  format: string,
  matches: number,
  unfinished: number,
  finals: number,
) {
  if (
    matches === 0 ||
    unfinished > 0 ||
    (format !== 'round_robin' && finals !== 1)
  )
    throw new DomainError(
      'conflict',
      'LEAGUE_MATCHES_INCOMPLETE',
      'All scheduled matches and the tournament final must be completed before closing the league',
    );
}
