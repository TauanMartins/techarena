export interface RegisterTeamQueries {
  registerTeamLockRegistrationContext(
    leagueId: string,
    teamId: string,
    actor: string,
  ): Promise<
    {
      ownerId: string | null;
      sportId: string | null;
      status: string;
      registered: boolean;
      captain: boolean;
    }[]
  >;
  registerTeamInsertTeam(teamId: string, leagueId: string): Promise<unknown>;
  registerTeamAcceptInvitation(
    leagueId: string,
    teamId: string,
  ): Promise<unknown>;
}
