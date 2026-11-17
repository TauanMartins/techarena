import { assertTeamRegistration } from '../../domain/assert-team-registration.js';
import type { LeagueStore } from '../ports/league-store.port.js';

export async function registerTeam(
  store: LeagueStore,
  actor: string,
  leagueId: string,
  teamId: string,
) {
  await store.transaction(async (manager) => {
    const rows = await manager.registerTeamLockRegistrationContext(
      leagueId,
      teamId,
      actor,
    );
    const league = rows[0];
    assertTeamRegistration(league, actor);
    await manager.registerTeamInsertTeam(teamId, leagueId);
    await manager.registerTeamAcceptInvitation(leagueId, teamId);
  });
}
