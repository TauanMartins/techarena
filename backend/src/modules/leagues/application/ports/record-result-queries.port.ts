export interface RecordResultQueries {
  recordResultLockMatch(
    leagueId: string,
    matchId: string,
  ): Promise<
    {
      organizerId: string | null;
      appointmentId: string;
      homeTeamId: string;
      awayTeamId: string;
      resultAllowed: boolean;
      phase: 'manual' | 'group' | 'knockout';
      leagueStatus: string;
    }[]
  >;
  recordResultSaveResult(
    appointmentId: string,
    winnerTeamId: string | null,
    loserTeamId: string | null,
    winnerScore: number,
    loserScore: number,
  ): Promise<unknown>;
  recordResultFinishAppointment(appointmentId: string): Promise<unknown>;
}
