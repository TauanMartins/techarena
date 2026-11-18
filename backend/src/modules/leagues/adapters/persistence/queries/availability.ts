import { databaseWrite } from '../../../../../common/persistence/database-write.js';
import type { AvailabilityQueries } from '../../../application/ports/availability-queries.port.js';
import type { SqlExecutor } from '../sql-executor.js';
export function availabilityQueries(
  executor: SqlExecutor,
): AvailabilityQueries {
  return {
    availabilityFindLeague: (leagueId) =>
      databaseWrite(() =>
        executor.query<{ sportId: string | null }[]>(
          `SELECT sport_id::text AS "sportId"
       FROM public.league WHERE id=$1`,
          [leagueId],
        ),
      ),
    availabilityFindCompatibleArena: (leagueId, arenaId) =>
      databaseWrite(() =>
        executor.query<{ id: string }[]>(
          `SELECT arena.id::text AS id
       FROM public.league l
       JOIN public.sport_arena sa ON sa.sport_id=l.sport_id AND sa.arena_id=$2
       JOIN public.arena arena ON arena.id=sa.arena_id
       WHERE l.id=$1`,
          [leagueId, arenaId],
        ),
      ),
    availabilityListAvailableSchedules: (date, now, arenaId) =>
      databaseWrite(() =>
        executor.query<{ id: string; horary: string }[]>(
          `SELECT schedule.id::text AS id, schedule.horary
       FROM public.schedule schedule
       WHERE ((CAST($1 AS date) + schedule.horary) AT TIME ZONE 'America/Sao_Paulo') > $2
         AND NOT EXISTS (
           SELECT 1 FROM public.appointment a
           WHERE a.arena_id=$3
             AND a.scheduled_at=((CAST($1 AS date) + schedule.horary) AT TIME ZONE 'America/Sao_Paulo')
             AND a.deleted_at IS NULL AND a.status IN ('scheduled', 'in_progress')
         )
       ORDER BY schedule.horary`,
          [date, now, arenaId],
        ),
      ),
  };
}
