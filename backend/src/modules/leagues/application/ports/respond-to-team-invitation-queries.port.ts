export interface RespondToTeamInvitationQueries {
  respondToTeamInvitationLockInvitation(
    invitationId: string,
    actor: string,
  ): Promise<
    {
      leagueId: string;
      leagueStatus: string;
      teamId: string;
      captain: boolean;
      invitationStatus: string;
    }[]
  >;
  respondToTeamInvitationRegisterTeam(
    teamId: string,
    leagueId: string,
  ): Promise<unknown>;
  respondToTeamInvitationSetStatus(
    invitationId: string,
    value2: string,
  ): Promise<unknown>;
}
