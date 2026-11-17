export interface InviteTeamQueries {
  inviteTeamLockLeague(
    leagueId: string,
  ): Promise<{ ownerId: string | null; status: string }[]>;
  inviteTeamReadTeamEligibility(
    teamId: string,
  ): Promise<{ exists: boolean; hasCaptain: boolean }[]>;
  inviteTeamCheckRegistered(
    leagueId: string,
    teamId: string,
  ): Promise<{ exists: boolean }[]>;
  inviteTeamLockInvitation(
    leagueId: string,
    teamId: string,
  ): Promise<{ id: string; status: string }[]>;
  inviteTeamReopenInvitation(id: string, actor: string): Promise<unknown>;
  inviteTeamInsertInvitation(
    leagueId: string,
    teamId: string,
    actor: string,
  ): Promise<unknown>;
}
