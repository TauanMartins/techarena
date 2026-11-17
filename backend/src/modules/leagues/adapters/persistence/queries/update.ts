import { databaseWrite } from '../../../../../common/persistence/database-write.js';
import type { UpdateQueries } from '../../../application/ports/update-queries.port.js';
import type { LeagueInput } from '../../../domain/league.js';
import type { SqlExecutor } from '../sql-executor.js';
export function updateQueries(executor: SqlExecutor): UpdateQueries {
  return {
    updateLockLeague: (leagueId) =>
      databaseWrite(() =>
        executor.query<{ ownerId: string | null; matchCount: number }[]>(
          `SELECT l.owner_id::text AS "ownerId",
             (SELECT count(*)::int FROM public.league_match lm
               WHERE lm.league_id=l.id) AS "matchCount"
           FROM public.league l WHERE l.id=$1 FOR UPDATE OF l`,
          [leagueId],
        ),
      ),
    updateReadSettings: (leagueId) =>
      databaseWrite(() =>
        executor.query<
          {
            tournamentFormat: LeagueInput['tournamentFormat'];
            groupCount: number;
            qualifiersPerGroup: number;
          }[]
        >(
          `SELECT tournament_format AS "tournamentFormat",
               group_count AS "groupCount",
               qualifiers_per_group AS "qualifiersPerGroup"
             FROM public.league WHERE id=$1`,
          [leagueId],
        ),
      ),
    updateUpdateLeague: (
      leagueId,
      value2,
      value3,
      value4,
      value5,
      value6,
      value7,
      value8,
      value9,
      value10,
      value11,
      value12,
      value13,
    ) =>
      databaseWrite(() =>
        executor.query<unknown>(
          `UPDATE public.league SET
             name=CASE WHEN $2 THEN $3 ELSE name END,
             description=CASE WHEN $4 THEN $5 ELSE description END,
             sport_id=CASE WHEN $6 THEN $7 ELSE sport_id END,
             tournament_format=CASE WHEN $8 THEN $9 ELSE tournament_format END,
             group_count=CASE WHEN $10 THEN $11 ELSE group_count END,
             qualifiers_per_group=CASE WHEN $12 THEN $13 ELSE qualifiers_per_group END
           WHERE id=$1`,
          [
            leagueId,
            value2,
            value3,
            value4,
            value5,
            value6,
            value7,
            value8,
            value9,
            value10,
            value11,
            value12,
            value13,
          ],
        ),
      ),
  };
}
