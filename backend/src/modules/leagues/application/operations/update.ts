import { assertLeagueUpdate } from '../../domain/assert-league-update.js';
import { assertTournamentOptions } from '../../domain/league-policy.js';
import type { LeagueUpdateInput } from '../../domain/league.js';
import type { LeagueStore } from '../ports/league-store.port.js';

export async function update(
  store: LeagueStore,
  actor: string,
  leagueId: string,
  input: LeagueUpdateInput,
) {
  await store.transaction(async (manager) => {
    const rows = await manager.updateLockLeague(leagueId);
    assertLeagueUpdate(rows[0], actor, input);
    if (
      input.tournamentFormat ||
      input.groupCount ||
      input.qualifiersPerGroup
    ) {
      const current = await manager.updateReadSettings(leagueId);
      const settings = current[0];
      const format = input.tournamentFormat ?? settings.tournamentFormat;
      const groupCount = input.groupCount ?? settings.groupCount;
      const qualifiers =
        input.qualifiersPerGroup ?? settings.qualifiersPerGroup;
      assertTournamentOptions(format, groupCount, qualifiers);
    }
    await manager.updateUpdateLeague(
      leagueId,
      input.name !== undefined,
      input.name ?? null,
      input.description !== undefined,
      input.description ?? null,
      input.sportId !== undefined,
      input.sportId ?? null,
      input.tournamentFormat !== undefined,
      input.tournamentFormat ?? null,
      input.groupCount !== undefined,
      input.groupCount ?? null,
      input.qualifiersPerGroup !== undefined,
      input.qualifiersPerGroup ?? null,
    );
  });
}
