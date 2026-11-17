import { databaseWrite } from '../../../../../common/persistence/database-write.js';
import type { TeamInvitationsQueries } from '../../../application/ports/team-invitations-queries.port.js';
import type { LeagueTeamInvitationView } from '../../../domain/league.js';
import type { SqlExecutor } from '../sql-executor.js';
export function teamInvitationsQueries(
  executor: SqlExecutor,
): TeamInvitationsQueries {
  return {
    teamInvitationsListInvitations: (actor) =>
      databaseWrite(() =>
        executor.query<LeagueTeamInvitationView[]>(
          `SELECT invitation.id::text AS id,
         invitation.league_id::text AS "leagueId",
         league.name AS "leagueName", invitation.team_id::text AS "teamId",
         team.name AS "teamName", invitation.invited_at AS "invitedAt"
       FROM public.league_team_invitation invitation
       JOIN public.league ON league.id=invitation.league_id
       JOIN public.team ON team.id=invitation.team_id
       WHERE invitation.status='pending' AND league.status='open'
         AND EXISTS (
           SELECT 1 FROM public.user_team membership
           WHERE membership.team_id=team.id
             AND membership.user_id=$1 AND membership.role='captain'
         )
       ORDER BY invitation.invited_at, invitation.id`,
          [actor],
        ),
      ),
  };
}
