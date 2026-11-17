import { databaseWrite } from '../../../../../common/persistence/database-write.js';
import type { GenerateFixturesQueries } from '../../../application/ports/generate-fixtures-queries.port.js';
import type { LeagueInput } from '../../../domain/league.js';
import type { SqlExecutor } from '../sql-executor.js';
export function generateFixturesQueries(
  executor: SqlExecutor,
): GenerateFixturesQueries {
  return {
    generateFixturesLockLeague: (leagueId) =>
      databaseWrite(() =>
        executor.query<
          {
            ownerId: string | null;
            name: string;
            sportId: string | null;
            status: string;
            format: LeagueInput['tournamentFormat'];
            groupCount: number;
            qualifiersPerGroup: number;
          }[]
        >(
          `SELECT owner_id::text AS "ownerId", name, sport_id::text AS "sportId",
             status, tournament_format AS format, group_count AS "groupCount",
             qualifiers_per_group AS "qualifiersPerGroup"
           FROM public.league WHERE id=$1 FOR UPDATE`,
          [leagueId],
        ),
      ),
    generateFixturesFindExistingMatches: (leagueId) =>
      databaseWrite(() =>
        executor.query<{ id: string }[]>(
          `SELECT 1 FROM public.league_match WHERE league_id=$1 LIMIT 1`,
          [leagueId],
        ),
      ),
    generateFixturesListTeams: (leagueId) =>
      databaseWrite(() =>
        executor.query<{ id: string }[]>(
          `SELECT team_id::text AS id FROM public.league_team
           WHERE league_id=$1 ORDER BY team_id`,
          [leagueId],
        ),
      ),
    generateFixturesAssignGroup: (leagueId, teamId, value3) =>
      databaseWrite(() =>
        executor.query<unknown>(
          `UPDATE public.league_team SET group_number=$3
               WHERE league_id=$1 AND team_id=$2`,
          [leagueId, teamId, value3],
        ),
      ),
    generateFixturesFindSport: (sportId) =>
      databaseWrite(() =>
        executor.query<{ maxPlayers: number }[]>(
          `SELECT default_value_player_numbers AS "maxPlayers"
           FROM public.sport WHERE id=$1`,
          [sportId],
        ),
      ),
    generateFixturesActivateLeague: (leagueId) =>
      databaseWrite(() =>
        executor.query<unknown>(
          `UPDATE public.league SET status='active' WHERE id=$1`,
          [leagueId],
        ),
      ),
  };
}
