import { DomainError } from '../../../common/domain/domain-error.js';

export function assertValidScores(homeScore: number, awayScore: number) {
  if (
    !Number.isSafeInteger(homeScore) ||
    !Number.isSafeInteger(awayScore) ||
    homeScore < 0 ||
    awayScore < 0
  )
    throw new DomainError(
      'invalid',
      'LEAGUE_SCORE_INVALID',
      'Scores must be non-negative integers',
    );
}
