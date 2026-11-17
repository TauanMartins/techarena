import type { LeagueResultInput } from '../../domain/league.js';
import { planMatchResult } from '../../domain/plan-match-result.js';
import type { LeagueStore } from '../ports/league-store.port.js';

export async function recordResult(
  store: LeagueStore,
  actor: string,
  leagueId: string,
  matchId: string,
  input: LeagueResultInput,
) {
  await store.transaction(async (manager) => {
    const rows = await manager.recordResultLockMatch(leagueId, matchId);
    const match = rows[0];
    const result = planMatchResult(match, actor, input);
    const {
      appointmentId,
      winnerTeamId,
      loserTeamId,
      winnerScore,
      loserScore,
    } = result;
    await manager.recordResultSaveResult(
      appointmentId,
      winnerTeamId,
      loserTeamId,
      winnerScore,
      loserScore,
    );
    await manager.recordResultFinishAppointment(appointmentId);
  });
}
