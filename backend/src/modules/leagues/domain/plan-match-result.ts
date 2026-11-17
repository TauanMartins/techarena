import { DomainError } from '../../../common/domain/domain-error.js';
import type { LeagueResultInput } from './league.js';
export interface ResultMatch {
  organizerId: string | null;
  appointmentId: string;
  homeTeamId: string;
  awayTeamId: string;
  resultAllowed: boolean;
  phase: 'manual' | 'group' | 'knockout';
  leagueStatus: string;
}
export function planMatchResult(
  match: ResultMatch | undefined,
  actor: string,
  input: LeagueResultInput,
) {
  if (!match)
    throw new DomainError(
      'not_found',
      'LEAGUE_MATCH_NOT_FOUND',
      'Match not found',
    );
  if (match.organizerId !== actor)
    throw new DomainError(
      'forbidden',
      'LEAGUE_RESULT_FORBIDDEN',
      'Only the league organizer can record match results',
    );
  if (!['open', 'active'].includes(match.leagueStatus))
    throw new DomainError(
      'conflict',
      'LEAGUE_ALREADY_FINISHED',
      'Results cannot be changed after the league has been closed',
    );
  if (match.phase === 'knockout' && input.homeScore === input.awayScore)
    throw new DomainError(
      'invalid',
      'KNOCKOUT_DRAW_NOT_ALLOWED',
      'Knockout matches must have a winner',
    );
  if (!match.resultAllowed)
    throw new DomainError(
      'conflict',
      'LEAGUE_MATCH_NOT_PLAYED',
      'A result can only be recorded after a scheduled match',
    );
  const isDraw = input.homeScore === input.awayScore;
  const winnerTeamId = isDraw
    ? null
    : input.homeScore > input.awayScore
      ? match.homeTeamId
      : match.awayTeamId;
  const loserTeamId = isDraw
    ? null
    : input.homeScore > input.awayScore
      ? match.awayTeamId
      : match.homeTeamId;
  const winnerScore = isDraw
    ? input.homeScore
    : Math.max(input.homeScore, input.awayScore);
  const loserScore = isDraw
    ? input.awayScore
    : Math.min(input.homeScore, input.awayScore);
  return {
    appointmentId: match.appointmentId,
    winnerTeamId,
    loserTeamId,
    winnerScore,
    loserScore,
  };
}
