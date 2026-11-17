import { assertTeamRemoval } from '../../domain/assert-team-removal.js';

import { assertTeamRemovalOpen } from '../../domain/assert-team-removal-open.js';
import type { LeagueStore } from '../ports/league-store.port.js';

export async function removeTeam(
  store: LeagueStore,
  actor: string,
  leagueId: string,
  teamId: string,
) {
  await store.transaction(async (manager) => {
    const leagues = await manager.removeTeamLockLeague(leagueId);
    const league = assertTeamRemovalOpen(leagues[0]);
    const rows = await manager.removeTeamCheckTeamMatches(
      leagueId,
      teamId,
      actor,
    );
    const membership = rows[0];
    assertTeamRemoval(league, membership, actor);
    await manager.removeTeamDeleteTeam(leagueId, teamId);
  });
}
