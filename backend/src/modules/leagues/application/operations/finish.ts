import { assertLeagueClosing } from '../../domain/assert-league-closing.js';
import { assertLeagueCompletion } from '../../domain/assert-league-completion.js';
import type { LeagueStore } from '../ports/league-store.port.js';

export async function finish(
  store: LeagueStore,
  actor: string,
  leagueId: string,
  status: 'completed' | 'canceled',
) {
  await store.transaction(async (manager) => {
    const rows = await manager.finishLockLeague(leagueId);
    const league = assertLeagueClosing(rows[0], actor);
    if (status === 'completed') {
      const incomplete = await manager.finishCountUnfinishedMatches(leagueId);
      const matchCount = await manager.finishCountMatches(leagueId);
      const finalRows = await manager.finishReadFinal(leagueId);
      assertLeagueCompletion(
        league.format,
        Number(matchCount[0]?.count ?? 0),
        Number(incomplete[0].count),
        Number(finalRows[0]?.count ?? 0),
      );
    } else {
      await manager.finishCancelAppointments(leagueId);
    }
    await manager.finishSetStatus(leagueId, status);
  });
}
