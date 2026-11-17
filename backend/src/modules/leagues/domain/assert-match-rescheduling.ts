import { DomainError } from '../../../common/domain/domain-error.js';
import type { LeagueMatchInput } from './league.js';
export function assertMatchRescheduling(
  match:
    | {
        ownerId: string | null;
        appointmentId: string;
        homeTeamId: string;
        awayTeamId: string;
        sportId: string | null;
        leagueStatus: string;
        status: string;
        scheduledAt: Date;
        hasResult: boolean;
      }
    | undefined,
  actor: string,
  input: LeagueMatchInput,
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
      'LEAGUE_MATCH_UPDATE_FORBIDDEN',
      'Only the organizer can reschedule this match',
    );
  if (!['open', 'active'].includes(match.leagueStatus))
    throw new DomainError(
      'conflict',
      'LEAGUE_ALREADY_FINISHED',
      'Matches cannot be changed after the league has been closed',
    );
  if (
    match.hasResult ||
    match.status !== 'scheduled' ||
    new Date(match.scheduledAt) <= now
  )
    throw new DomainError(
      'conflict',
      'LEAGUE_MATCH_NOT_RESCHEDULABLE',
      'Only future matches without results can be rescheduled',
    );
  if (
    input.homeTeamId !== match.homeTeamId ||
    input.awayTeamId !== match.awayTeamId
  )
    throw new DomainError(
      'invalid',
      'LEAGUE_TEAMS_IMMUTABLE',
      'Rescheduling cannot change the competing teams',
    );
  if (!match.sportId)
    throw new DomainError(
      'conflict',
      'LEAGUE_SPORT_MISSING',
      'The league has no sport configured',
    );

  return { ...match, sportId: match.sportId };
}
