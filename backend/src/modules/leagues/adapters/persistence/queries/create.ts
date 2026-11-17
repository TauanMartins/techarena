import { databaseWrite } from '../../../../../common/persistence/database-write.js';
import type { CreateQueries } from '../../../application/ports/create-queries.port.js';
import type { SqlExecutor } from '../sql-executor.js';
export function createQueries(executor: SqlExecutor): CreateQueries {
  return {
    createInsertLeague: (
      name,
      value2,
      actor,
      sportId,
      tournamentFormat,
      value6,
      value7,
    ) =>
      databaseWrite(() =>
        executor.query<{ id: string }[]>(
          `INSERT INTO public.league (
           name, description, owner_id, sport_id, tournament_format,
           group_count, qualifiers_per_group
         ) VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id::text AS id`,
          [name, value2, actor, sportId, tournamentFormat, value6, value7],
        ),
      ),
  };
}
