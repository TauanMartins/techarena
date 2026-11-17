export interface CancelMatchQueries {
  cancelMatchLockMatch(
    leagueId: string,
    matchId: string,
  ): Promise<
    {
      ownerId: string | null;
      leagueStatus: string;
      appointmentId: string;
      status: string;
      scheduledAt: Date;
      hasResult: boolean;
      phase: string;
    }[]
  >;
  cancelMatchCancelAppointment(appointmentId: string): Promise<unknown>;
}
