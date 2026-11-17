import { databaseWrite } from '../../../../../common/persistence/database-write.js';
import type { RescheduleMatchQueries } from '../../../application/ports/reschedule-match-queries.port.js';
import type { SqlExecutor } from '../sql-executor.js';
export function rescheduleMatchQueries(
  executor: SqlExecutor,
): RescheduleMatchQueries {
  return {
    rescheduleMatchLockMatch: (leagueId, matchId) =>
      databaseWrite(() =>
        executor.query<
          {
            ownerId: string | null;
            appointmentId: string;
            homeTeamId: string;
            awayTeamId: string;
            sportId: string | null;
            leagueStatus: string;
            status: string;
            scheduledAt: Date;
            hasResult: boolean;
          }[]
        >(
          `SELECT l.owner_id::text AS "ownerId",
             lm.appointment_id::text AS "appointmentId",
             lm.home_team_id::text AS "homeTeamId",
             lm.away_team_id::text AS "awayTeamId", l.sport_id::text AS "sportId",
             l.status AS "leagueStatus", a.status,
             a.scheduled_at AS "scheduledAt",
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
    rescheduleMatchFindCompatibleArena: (arenaId, sportId) =>
      databaseWrite(() =>
        executor.query<{ lat: string; longitude: string }[]>(
          `SELECT arena.lat::text AS lat, arena.longitude::text AS longitude
           FROM public.arena arena
           JOIN public.sport_arena sa ON sa.arena_id=arena.id AND sa.sport_id=$2
           WHERE arena.id=$1`,
          [arenaId, sportId],
        ),
      ),
    rescheduleMatchFindSchedule: (scheduleId) =>
      databaseWrite(() =>
        executor.query<{ horary: string }[]>(
          `SELECT horary FROM public.schedule WHERE id=$1`,
          [scheduleId],
        ),
      ),
    rescheduleMatchCheckSlot: (arenaId, scheduledAt, appointmentId) =>
      databaseWrite(() =>
        executor.query<{ available: boolean }[]>(
          `SELECT NOT EXISTS (
             SELECT 1 FROM public.appointment
             WHERE arena_id=$1 AND scheduled_at=$2 AND id<>$3
               AND deleted_at IS NULL AND status IN ('scheduled', 'in_progress')
           ) AS available`,
          [arenaId, scheduledAt, appointmentId],
        ),
      ),
    rescheduleMatchRescheduleAppointment: (
      appointmentId,
      scheduledAt,
      arenaId,
      scheduleId,
      longitude,
      lat,
    ) =>
      databaseWrite(() =>
        executor.query<unknown>(
          `UPDATE public.appointment SET
             scheduled_at=$2, arena_id=$3, schedule_id=$4,
             location=ST_SetSRID(ST_MakePoint($5, $6), 0), updated_at=now()
           WHERE id=$1`,
          [appointmentId, scheduledAt, arenaId, scheduleId, longitude, lat],
        ),
      ),
  };
}
