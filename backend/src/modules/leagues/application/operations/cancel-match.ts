import { assertMatchCancellation } from '../../domain/assert-match-cancellation.js';
import type { LeagueStore } from '../ports/league-store.port.js';

export async function cancelMatch(
  store: LeagueStore,
  actor: string,
  leagueId: string,
  matchId: string,
  clock: () => Date,
) {
  await store.transaction(async (manager) => {
    const rows = await manager.cancelMatchLockMatch(leagueId, matchId);
    const match = assertMatchCancellation(rows[0], actor, clock());
    await manager.cancelMatchCancelAppointment(match.appointmentId);
  });
}
