import type { LeagueTeamInvitationView } from '../../domain/league.js';
export interface TeamInvitationsQueries {
  teamInvitationsListInvitations(
    actor: string,
  ): Promise<LeagueTeamInvitationView[]>;
}
