export interface CreateMatchQueries {
  createMatchLockLeague(leagueId: string): Promise<
    {
      name: string;
      ownerId: string | null;
      sportId: string | null;
      status: string;
    }[]
  >;
  createMatchFindRegisteredTeams(
    leagueId: string,
    homeTeamId: string,
    awayTeamId: string,
  ): Promise<{ count: number }[]>;
  createMatchLockArena(arenaId: string): Promise<unknown>;
  createMatchFindCompatibleArena(
    arenaId: string,
    sportId: string,
  ): Promise<{ address: string; lat: string; longitude: string }[]>;
  createMatchFindSchedule(scheduleId: string): Promise<{ horary: string }[]>;
  createMatchCheckSlot(
    arenaId: string,
    scheduledAt: Date,
  ): Promise<{ available: boolean }[]>;
  createMatchFindSport(
    sportId: string,
  ): Promise<{ name: string; maxPlayers: number }[]>;
  createMatchNextMatchNumber(leagueId: string): Promise<{ number: number }[]>;
  createMatchInsertAppointment(
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
  createMatchInsertMatch(
    leagueId: string,
    appointmentId: string,
    matchNumber: number,
    homeTeamId: string,
    awayTeamId: string,
  ): Promise<unknown>;
  createMatchAddTeamParticipants(
    appointmentId: string,
    homeTeamId: string,
    awayTeamId: string,
  ): Promise<unknown>;
  createMatchAddOrganizer(
    appointmentId: string,
    actor: string,
  ): Promise<unknown>;
  createMatchActivateLeague(leagueId: string): Promise<unknown>;
}
