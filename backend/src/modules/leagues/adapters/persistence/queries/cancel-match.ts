import { databaseWrite } from '../../../../../common/persistence/database-write.js';
import type { CancelMatchQueries } from '../../../application/ports/cancel-match-queries.port.js';
import type { SqlExecutor } from '../sql-executor.js';
export function cancelMatchQueries(executor: SqlExecutor): CancelMatchQueries {
  return {
    cancelMatchLockMatch: (leagueId, matchId) =>
      databaseWrite(() =>
        executor.query<
          {
            ownerId: string | null;
            leagueStatus: string;
            appointmentId: string;
            status: string;
            scheduledAt: Date;
            hasResult: boolean;
            phase: string;
          }[]
        >(
          `SELECT l.owner_id::text AS "ownerId", l.status AS "leagueStatus",
             a.id::text AS "appointmentId", lm.phase,
             a.status, a.scheduled_at AS "scheduledAt",
             EXISTS(SELECT 1 FROM public.appointment_result r
               WHERE r.appointment_id=a.id) AS "hasResult"
           FROM public.league_match lm
           JOIN public.league l ON l.id=lm.league_id
           JOIN public.appointment a ON a.id=lm.appointment_id
           WHERE lm.league_id=$1 AND lm.id=$2
           FOR UPDATE OF l, lm, a`,
          [leagueId, matchId],
        ),
      ),
    cancelMatchCancelAppointment: (appointmentId) =>
      databaseWrite(() =>
        executor.query<unknown>(
          `UPDATE public.appointment SET status='canceled', updated_at=now()
           WHERE id=$1`,
          [appointmentId],
        ),
      ),
  };
}
