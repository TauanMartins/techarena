export interface RescheduleMatchQueries {
  rescheduleMatchLockMatch(
    leagueId: string,
    matchId: string,
  ): Promise<
    {
      ownerId: string | null;
      appointmentId: string;
      homeTeamId: string;
      awayTeamId: string;
      sportId: string | null;
      leagueStatus: string;
      status: string;
      scheduledAt: Date;
      hasResult: boolean;
    }[]
  >;
  rescheduleMatchFindCompatibleArena(
    arenaId: string,
    sportId: string,
  ): Promise<{ lat: string; longitude: string }[]>;
  rescheduleMatchFindSchedule(
    scheduleId: string,
  ): Promise<{ horary: string }[]>;
  rescheduleMatchCheckSlot(
    arenaId: string,
    scheduledAt: Date,
    appointmentId: string,
  ): Promise<{ available: boolean }[]>;
  rescheduleMatchRescheduleAppointment(
    appointmentId: string,
    scheduledAt: Date,
    arenaId: string,
    scheduleId: string,
    longitude: string,
    lat: string,
  ): Promise<unknown>;
}
