import { databaseWrite } from '../../../../../common/persistence/database-write.js';
import type { ArenasQueries } from '../../../application/ports/arenas-queries.port.js';
import type { LeagueArena } from '../../../domain/league.js';
import type { SqlExecutor } from '../sql-executor.js';
export function arenasQueries(executor: SqlExecutor): ArenasQueries {
  return {
    arenasListCompatibleArenas: (leagueId) =>
      databaseWrite(() =>
        executor.query<LeagueArena[]>(
          `SELECT arena.id::text AS id, arena.address, arena.image
       FROM public.league l
       JOIN public.sport_arena sa ON sa.sport_id=l.sport_id
       JOIN public.arena arena ON arena.id=sa.arena_id
       WHERE l.id=$1
       ORDER BY arena.address, arena.id`,
          [leagueId],
        ),
      ),
    arenasFindLeague: (leagueId) =>
      databaseWrite(() =>
        executor.query<{ id: string }[]>(
          `SELECT 1 FROM public.league WHERE id=$1`,
          [leagueId],
        ),
      ),
  };
}
