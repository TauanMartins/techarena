import { databaseWrite } from '../../../../../common/persistence/database-write.js';
import type { FinishQueries } from '../../../application/ports/finish-queries.port.js';
import type { SqlExecutor } from '../sql-executor.js';
export function finishQueries(executor: SqlExecutor): FinishQueries {
  return {
    finishLockLeague: (leagueId) =>
      databaseWrite(() =>
        executor.query<
          { ownerId: string | null; status: string; format: string }[]
        >(
          `SELECT owner_id::text AS "ownerId", status, tournament_format AS format
           FROM public.league WHERE id=$1 FOR UPDATE`,
          [leagueId],
        ),
      ),
    finishCountUnfinishedMatches: (leagueId) =>
      databaseWrite(() =>
        executor.query<{ count: number }[]>(
          `SELECT count(*)::int AS count
             FROM public.league_match lm
             JOIN public.appointment a ON a.id=lm.appointment_id
             LEFT JOIN public.appointment_result r ON r.appointment_id=a.id
             WHERE lm.league_id=$1 AND a.status<>'canceled' AND r.id IS NULL`,
          [leagueId],
        ),
      ),
    finishCountMatches: (leagueId) =>
      databaseWrite(() =>
        executor.query<{ count: number }[]>(
          `SELECT count(*)::int AS count FROM public.league_match
             WHERE league_id=$1`,
          [leagueId],
        ),
      ),
    finishReadFinal: (leagueId) =>
      databaseWrite(() =>
        executor.query<{ count: number }[]>(
          `SELECT count(*)::int AS count
             FROM public.league_match lm
             JOIN public.appointment a ON a.id=lm.appointment_id
             JOIN public.appointment_result r ON r.appointment_id=a.id
             WHERE lm.league_id=$1 AND lm.phase='knockout'
               AND lm.round_number=(SELECT max(round_number) FROM public.league_match
                 WHERE league_id=$1 AND phase='knockout')
               AND a.status='finished' AND r.winner_team_id IS NOT NULL`,
          [leagueId],
        ),
      ),
    finishCancelAppointments: (leagueId) =>
      databaseWrite(() =>
        executor.query<unknown>(
          `UPDATE public.appointment SET status='canceled', updated_at=now()
             WHERE id IN (SELECT appointment_id FROM public.league_match WHERE league_id=$1)
               AND status='scheduled'`,
          [leagueId],
        ),
      ),
    finishSetStatus: (leagueId, status) =>
      databaseWrite(() =>
        executor.query<unknown>(
          `UPDATE public.league SET status=$2 WHERE id=$1`,
          [leagueId, status],
        ),
      ),
  };
}
