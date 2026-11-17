import { databaseWrite } from '../../../../../common/persistence/database-write.js';
import type { RegisterTeamQueries } from '../../../application/ports/register-team-queries.port.js';
import type { SqlExecutor } from '../sql-executor.js';
export function registerTeamQueries(
  executor: SqlExecutor,
): RegisterTeamQueries {
  return {
    registerTeamLockRegistrationContext: (leagueId, teamId, actor) =>
      databaseWrite(() =>
        executor.query<
          {
            ownerId: string | null;
            sportId: string | null;
            status: string;
            registered: boolean;
            captain: boolean;
          }[]
        >(
          `SELECT l.owner_id::text AS "ownerId", l.sport_id::text AS "sportId",
          l.status,
          EXISTS(SELECT 1 FROM public.league_team WHERE league_id=l.id AND team_id=$2) AS registered,
          EXISTS(SELECT 1 FROM public.user_team WHERE team_id=$2 AND user_id=$3 AND role='captain') AS captain
         FROM public.league l WHERE l.id=$1
         FOR UPDATE OF l`,
          [leagueId, teamId, actor],
        ),
      ),
    registerTeamInsertTeam: (teamId, leagueId) =>
      databaseWrite(() =>
        executor.query<unknown>(
          `INSERT INTO public.league_team (team_id, league_id) VALUES ($1, $2)`,
          [teamId, leagueId],
        ),
      ),
    registerTeamAcceptInvitation: (leagueId, teamId) =>
      databaseWrite(() =>
        executor.query<unknown>(
          `UPDATE public.league_team_invitation
           SET status='accepted', responded_at=now()
           WHERE league_id=$1 AND team_id=$2 AND status='pending'`,
          [leagueId, teamId],
        ),
      ),
  };
}
