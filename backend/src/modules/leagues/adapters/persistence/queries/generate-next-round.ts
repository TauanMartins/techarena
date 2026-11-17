import { databaseWrite } from '../../../../../common/persistence/database-write.js';
import type { GenerateNextRoundQueries } from '../../../application/ports/generate-next-round-queries.port.js';
import type { LeagueInput } from '../../../domain/league.js';
import type { SqlExecutor } from '../sql-executor.js';
export function generateNextRoundQueries(
  executor: SqlExecutor,
): GenerateNextRoundQueries {
  return {
    generateNextRoundLockLeague: (leagueId) =>
      databaseWrite(() =>
        executor.query<
          {
            ownerId: string | null;
            name: string;
            sportId: string | null;
            status: string;
            format: LeagueInput['tournamentFormat'];
            groupCount: number;
            qualifiersPerGroup: number;
          }[]
        >(
          `SELECT owner_id::text AS "ownerId", name, sport_id::text AS "sportId",
             status, tournament_format AS format, group_count AS "groupCount",
             qualifiers_per_group AS "qualifiersPerGroup"
           FROM public.league WHERE id=$1 FOR UPDATE`,
          [leagueId],
        ),
      ),
    generateNextRoundLockMatches: (leagueId) =>
      databaseWrite(() =>
        executor.query<
          {
            id: string;
            matchNumber: number;
            phase: 'group' | 'knockout' | 'manual';
            roundNumber: number;
            homeTeamId: string;
            awayTeamId: string;
            winnerTeamId: string | null;
          }[]
        >(
          `SELECT lm.id::text AS id, lm.match_number AS "matchNumber",
             lm.phase, lm.round_number AS "roundNumber",
             lm.home_team_id::text AS "homeTeamId",
             lm.away_team_id::text AS "awayTeamId",
             result.winner_team_id::text AS "winnerTeamId"
           FROM public.league_match lm
           JOIN public.appointment a ON a.id=lm.appointment_id
           LEFT JOIN public.appointment_result result ON result.appointment_id=a.id
           WHERE lm.league_id=$1 AND a.status<>'canceled'
           ORDER BY lm.match_number FOR UPDATE OF lm`,
          [leagueId],
        ),
      ),
    generateNextRoundCountUnresolvedKnockout: (leagueId) =>
      databaseWrite(() =>
        executor.query<{ missing: number }[]>(
          `SELECT count(*)::int AS missing
             FROM public.league_match lm
             JOIN public.appointment a ON a.id=lm.appointment_id
             LEFT JOIN public.appointment_result r ON r.appointment_id=a.id
             WHERE lm.league_id=$1 AND lm.phase='knockout'
               AND lm.round_number=(SELECT max(round_number) FROM public.league_match
                 WHERE league_id=$1 AND phase='knockout')
               AND (r.id IS NULL OR r.winner_team_id IS NULL)`,
          [leagueId],
        ),
      ),
    generateNextRoundCountUnresolvedGroups: (leagueId) =>
      databaseWrite(() =>
        executor.query<{ missing: number }[]>(
          `SELECT count(*)::int AS missing
               FROM public.league_match lm
               JOIN public.appointment a ON a.id=lm.appointment_id
               LEFT JOIN public.appointment_result r ON r.appointment_id=a.id
               WHERE lm.league_id=$1 AND lm.phase='group' AND a.status<>'canceled'
                 AND r.id IS NULL`,
          [leagueId],
        ),
      ),
    generateNextRoundReadStandings: (leagueId) =>
      databaseWrite(() =>
        executor.query<
          {
            teamId: string;
            groupNumber: number;
            points: number;
            wins: number;
            scoreDifference: number;
          }[]
        >(
          `SELECT t.id::text AS "teamId", lt.group_number AS "groupNumber",
               (count(r.id) FILTER (WHERE r.winner_team_id=t.id) * 3
                 + count(r.id) FILTER (WHERE r.id IS NOT NULL AND r.winner_team_id IS NULL))::int AS points,
               count(r.id) FILTER (WHERE r.winner_team_id=t.id)::int AS wins,
               (COALESCE(sum(CASE
                 WHEN r.winner_team_id=t.id THEN r.winner_score-r.loser_score
                 WHEN r.loser_team_id=t.id THEN r.loser_score-r.winner_score
                 WHEN r.id IS NOT NULL AND lm.home_team_id=t.id THEN r.winner_score-r.loser_score
                 WHEN r.id IS NOT NULL AND lm.away_team_id=t.id THEN r.loser_score-r.winner_score
                 ELSE 0 END), 0))::int AS "scoreDifference"
             FROM public.league_team lt
             JOIN public.team t ON t.id=lt.team_id
             LEFT JOIN public.league_match lm ON lm.league_id=lt.league_id
               AND lm.phase='group' AND t.id IN (lm.home_team_id, lm.away_team_id)
             LEFT JOIN public.appointment_result r ON r.appointment_id=lm.appointment_id
             WHERE lt.league_id=$1
             GROUP BY t.id, lt.group_number
             ORDER BY lt.group_number, points DESC, wins DESC, "scoreDifference" DESC, t.id`,
          [leagueId],
        ),
      ),
    generateNextRoundListTeams: (leagueId) =>
      databaseWrite(() =>
        executor.query<{ id: string }[]>(
          `SELECT team_id::text AS id FROM public.league_team WHERE league_id=$1`,
          [leagueId],
        ),
      ),
    generateNextRoundFindSport: (sportId) =>
      databaseWrite(() =>
        executor.query<{ maxPlayers: number }[]>(
          `SELECT default_value_player_numbers AS "maxPlayers"
           FROM public.sport WHERE id=$1`,
          [sportId],
        ),
      ),
  };
}
