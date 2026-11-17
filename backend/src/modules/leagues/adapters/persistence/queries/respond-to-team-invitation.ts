import { databaseWrite } from '../../../../../common/persistence/database-write.js';
import type { RespondToTeamInvitationQueries } from '../../../application/ports/respond-to-team-invitation-queries.port.js';
import type { SqlExecutor } from '../sql-executor.js';
export function respondToTeamInvitationQueries(
  executor: SqlExecutor,
): RespondToTeamInvitationQueries {
  return {
    respondToTeamInvitationLockInvitation: (invitationId, actor) =>
      databaseWrite(() =>
        executor.query<
          {
            leagueId: string;
            leagueStatus: string;
            teamId: string;
            captain: boolean;
            invitationStatus: string;
          }[]
        >(
          `SELECT invitation.league_id::text AS "leagueId",
             league.status AS "leagueStatus", invitation.team_id::text AS "teamId",
             invitation.status AS "invitationStatus",
             EXISTS(SELECT 1 FROM public.user_team membership
               WHERE membership.team_id=invitation.team_id AND membership.user_id=$2
                 AND membership.role='captain') AS captain
           FROM public.league_team_invitation invitation
           JOIN public.league ON league.id=invitation.league_id
           WHERE invitation.id=$1
           FOR UPDATE OF invitation, league`,
          [invitationId, actor],
        ),
      ),
    respondToTeamInvitationRegisterTeam: (teamId, leagueId) =>
      databaseWrite(() =>
        executor.query<unknown>(
          `INSERT INTO public.league_team (team_id, league_id)
             VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [teamId, leagueId],
        ),
      ),
    respondToTeamInvitationSetStatus: (invitationId, value2) =>
      databaseWrite(() =>
        executor.query<unknown>(
          `UPDATE public.league_team_invitation
           SET status=$2, responded_at=now() WHERE id=$1`,
          [invitationId, value2],
        ),
      ),
  };
}
