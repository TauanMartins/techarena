export interface RemoveTeamQueries {
  removeTeamLockLeague(
    leagueId: string,
  ): Promise<{ ownerId: string | null; status: string }[]>;
  removeTeamCheckTeamMatches(
    leagueId: string,
    teamId: string,
    actor: string,
  ): Promise<{ registered: boolean; captain: boolean; hasMatches: boolean }[]>;
  removeTeamDeleteTeam(leagueId: string, teamId: string): Promise<unknown>;
}
