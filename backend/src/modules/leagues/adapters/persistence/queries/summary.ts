import { databaseWrite } from '../../../../../common/persistence/database-write.js';
import type { SummaryRow } from '../../../application/ports/league-store.port.js';
import type { SummaryQueries } from '../../../application/ports/summary-queries.port.js';
import type { SqlExecutor } from '../sql-executor.js';
export function summaryQueries(executor: SqlExecutor): SummaryQueries {
  return {
    summaryListSummaries: (actor, value2) =>
      databaseWrite(() =>
        executor.query<SummaryRow[]>(
          `
        SELECT l.id::text AS id, l.name, l.description, l.image,
          l.owner_id::text AS "ownerId", owner.name AS "ownerName",
          l.sport_id::text AS "sportId", sport.name AS "sportName",
          l.tournament_format AS "tournamentFormat", l.status,
          l.group_count AS "groupCount",
          l.qualifiers_per_group AS "qualifiersPerGroup",
          l.created_at AS "createdAt",
          (SELECT count(*)::int FROM public.league_team lt WHERE lt.league_id=l.id) AS "teamCount",
          (SELECT count(*)::int FROM public.league_match lm WHERE lm.league_id=l.id) AS "matchCount",
          (SELECT count(*)::int FROM public.league_match lm
            JOIN public.appointment a ON a.id=lm.appointment_id
            WHERE lm.league_id=l.id AND a.status='finished') AS "completedMatchCount",
          COALESCE(l.owner_id=$1::uuid, false) AS "isOwner"
        FROM public.league l
        LEFT JOIN public.users owner ON owner.id=l.owner_id
        LEFT JOIN public.sport sport ON sport.id=l.sport_id
        WHERE ($2::bigint IS NULL OR l.id=$2)
        ORDER BY l.created_at DESC, l.id DESC
      `,
          [actor, value2],
        ),
      ),
  };
}
