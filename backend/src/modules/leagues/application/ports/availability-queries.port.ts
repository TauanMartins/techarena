export interface AvailabilityQueries {
  availabilityFindLeague(
    leagueId: string,
  ): Promise<{ sportId: string | null }[]>;
  availabilityFindCompatibleArena(
    leagueId: string,
    arenaId: string,
  ): Promise<{ id: string }[]>;
  availabilityListAvailableSchedules(
    date: string,
    now: Date,
    arenaId: string,
  ): Promise<{ id: string; horary: string }[]>;
}
