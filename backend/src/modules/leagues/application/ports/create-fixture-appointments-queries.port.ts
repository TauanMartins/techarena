export interface CreateFixtureAppointmentsQueries {
  createFixtureAppointmentsFindCompatibleArena(
    arenaId: string,
    sportId: string,
  ): Promise<{ address: string; lat: string; longitude: string }[]>;
  createFixtureAppointmentsFindSchedule(
    scheduleId: string,
  ): Promise<{ horary: string }[]>;
  createFixtureAppointmentsCheckSlot(
    arenaId: string,
    scheduledAt: Date,
  ): Promise<{ available: boolean }[]>;
  createFixtureAppointmentsInsertAppointment(
    actor: string,
    value2: string,
    value3: string,
    scheduledAt: Date,
    longitude: string,
    lat: string,
    maxPlayers: number,
    arenaId: string,
    sportId: string,
    scheduleId: string,
  ): Promise<{ id: string }[]>;
  createFixtureAppointmentsInsertMatch(
    leagueId: string,
    appointmentId: string,
    matchNumber: number,
    homeTeamId: string,
    awayTeamId: string,
    phase: string,
    roundNumber: number,
    groupNumber: number | null,
  ): Promise<unknown>;
  createFixtureAppointmentsAddTeamParticipants(
    appointmentId: string,
    homeTeamId: string,
    awayTeamId: string,
  ): Promise<unknown>;
  createFixtureAppointmentsAddOrganizer(
    appointmentId: string,
    actor: string,
  ): Promise<unknown>;
  createFixtureAppointmentsActivateLeague(leagueId: string): Promise<unknown>;
}
