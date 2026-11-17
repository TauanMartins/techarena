import { databaseWrite } from '../../../../../common/persistence/database-write.js';
import type { RemoveTeamQueries } from '../../../application/ports/remove-team-queries.port.js';
import type { SqlExecutor } from '../sql-executor.js';
export function removeTeamQueries(executor: SqlExecutor): RemoveTeamQueries {
  return {
    removeTeamLockLeague: (leagueId) =>
      databaseWrite(() =>
        executor.query<{ ownerId: string | null; status: string }[]>(
          `SELECT owner_id::text AS "ownerId", status
           FROM public.league WHERE id=$1 FOR UPDATE`,
          [leagueId],
        ),
      ),
    removeTeamCheckTeamMatches: (leagueId, teamId, actor) =>
      databaseWrite(() =>
        executor.query<
          { registered: boolean; captain: boolean; hasMatches: boolean }[]
        >(
          `SELECT EXISTS(
              SELECT 1 FROM public.league_team
              WHERE league_id=$1 AND team_id=$2
            ) AS registered,
            EXISTS(SELECT 1 FROM public.user_team WHERE team_id=$2 AND user_id=$3 AND role='captain') AS captain,
            EXISTS(SELECT 1 FROM public.league_match
              WHERE league_id=$1 AND (home_team_id=$2 OR away_team_id=$2)) AS "hasMatches"`,
          [leagueId, teamId, actor],
        ),
      ),
    removeTeamDeleteTeam: (leagueId, teamId) =>
      databaseWrite(() =>
        executor.query<unknown>(
          `DELETE FROM public.league_team WHERE league_id=$1 AND team_id=$2`,
          [leagueId, teamId],
        ),
      ),
  };
}
