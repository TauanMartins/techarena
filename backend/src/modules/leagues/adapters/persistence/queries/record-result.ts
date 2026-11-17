import { databaseWrite } from '../../../../../common/persistence/database-write.js';
import type { RecordResultQueries } from '../../../application/ports/record-result-queries.port.js';
import type { SqlExecutor } from '../sql-executor.js';
export function recordResultQueries(
  executor: SqlExecutor,
): RecordResultQueries {
  return {
    recordResultLockMatch: (leagueId, matchId) =>
      databaseWrite(() =>
        executor.query<
          {
            organizerId: string | null;
            appointmentId: string;
            homeTeamId: string;
            awayTeamId: string;
            resultAllowed: boolean;
            phase: 'manual' | 'group' | 'knockout';
            leagueStatus: string;
          }[]
        >(
          `SELECT l.owner_id::text AS "organizerId",
             lm.appointment_id::text AS "appointmentId",
             lm.home_team_id::text AS "homeTeamId",
             lm.away_team_id::text AS "awayTeamId",
             lm.phase, l.status AS "leagueStatus",
             (a.status <> 'canceled' AND a.scheduled_at <= CURRENT_TIMESTAMP) AS "resultAllowed"
           FROM public.league_match lm
           JOIN public.league l ON l.id=lm.league_id
           JOIN public.appointment a ON a.id=lm.appointment_id
           WHERE lm.league_id=$1 AND lm.id=$2
           FOR UPDATE OF l, lm`,
          [leagueId, matchId],
        ),
      ),
    recordResultSaveResult: (
      appointmentId,
      winnerTeamId,
      loserTeamId,
      winnerScore,
      loserScore,
    ) =>
      databaseWrite(() =>
        executor.query<unknown>(
          `INSERT INTO public.appointment_result
             (appointment_id, winner_team_id, loser_team_id, winner_score, loser_score, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, now(), now())
           ON CONFLICT (appointment_id) DO UPDATE SET
             winner_team_id=EXCLUDED.winner_team_id,
             loser_team_id=EXCLUDED.loser_team_id,
             winner_score=EXCLUDED.winner_score,
             loser_score=EXCLUDED.loser_score,
             updated_at=now()`,
          [appointmentId, winnerTeamId, loserTeamId, winnerScore, loserScore],
        ),
      ),
    recordResultFinishAppointment: (appointmentId) =>
      databaseWrite(() =>
        executor.query<unknown>(
          `UPDATE public.appointment SET status='finished', updated_at=now()
           WHERE id=$1`,
          [appointmentId],
        ),
      ),
  };
}
