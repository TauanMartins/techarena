export interface CreateQueries {
  createInsertLeague(
    name: string,
    value2: string | null,
    actor: string,
    sportId: string,
    tournamentFormat: string,
    value6: number,
    value7: number,
  ): Promise<{ id: string }[]>;
}
