import { databaseWrite } from '../../../../../common/persistence/database-write.js';
import type { InviteTeamQueries } from '../../../application/ports/invite-team-queries.port.js';
import type { SqlExecutor } from '../sql-executor.js';
export function inviteTeamQueries(executor: SqlExecutor): InviteTeamQueries {
  return {
    inviteTeamLockLeague: (leagueId) =>
      databaseWrite(() =>
        executor.query<{ ownerId: string | null; status: string }[]>(
          `SELECT owner_id::text AS "ownerId", status
           FROM public.league WHERE id=$1 FOR UPDATE`,
          [leagueId],
        ),
      ),
    inviteTeamReadTeamEligibility: (teamId) =>
      databaseWrite(() =>
        executor.query<{ exists: boolean; hasCaptain: boolean }[]>(
          `SELECT EXISTS(SELECT 1 FROM public.team WHERE id=$1) AS exists,
             EXISTS(SELECT 1 FROM public.user_team
               WHERE team_id=$1 AND role='captain') AS "hasCaptain"`,
          [teamId],
        ),
      ),
    inviteTeamCheckRegistered: (leagueId, teamId) =>
      databaseWrite(() =>
        executor.query<{ exists: boolean }[]>(
          `SELECT EXISTS(SELECT 1 FROM public.league_team
           WHERE league_id=$1 AND team_id=$2) AS exists`,
          [leagueId, teamId],
        ),
      ),
    inviteTeamLockInvitation: (leagueId, teamId) =>
      databaseWrite(() =>
        executor.query<{ id: string; status: string }[]>(
          `SELECT id::text AS id, status
           FROM public.league_team_invitation
           WHERE league_id=$1 AND team_id=$2 FOR UPDATE`,
          [leagueId, teamId],
        ),
      ),
    inviteTeamReopenInvitation: (id, actor) =>
      databaseWrite(() =>
        executor.query<unknown>(
          `UPDATE public.league_team_invitation
             SET invited_by=$2, status='pending', invited_at=now(),
                 responded_at=NULL
             WHERE id=$1`,
          [id, actor],
        ),
      ),
    inviteTeamInsertInvitation: (leagueId, teamId, actor) =>
      databaseWrite(() =>
        executor.query<unknown>(
          `INSERT INTO public.league_team_invitation
             (league_id, team_id, invited_by) VALUES ($1, $2, $3)`,
          [leagueId, teamId, actor],
        ),
      ),
  };
}
