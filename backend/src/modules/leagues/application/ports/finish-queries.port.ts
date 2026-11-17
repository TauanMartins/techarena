export interface FinishQueries {
  finishLockLeague(
    leagueId: string,
  ): Promise<{ ownerId: string | null; status: string; format: string }[]>;
  finishCountUnfinishedMatches(leagueId: string): Promise<{ count: number }[]>;
  finishCountMatches(leagueId: string): Promise<{ count: number }[]>;
  finishReadFinal(leagueId: string): Promise<{ count: number }[]>;
  finishCancelAppointments(leagueId: string): Promise<unknown>;
  finishSetStatus(leagueId: string, status: string): Promise<unknown>;
}
