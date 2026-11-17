import { assertInvitableTeam } from '../../domain/assert-invitable-team.js';
import { assertInvitationNotPending } from '../../domain/assert-invitation-not-pending.js';
import { assertTeamNotRegistered } from '../../domain/assert-team-not-registered.js';

import { assertLeagueInvitation } from '../../domain/assert-league-invitation.js';
import type { LeagueStore } from '../ports/league-store.port.js';

export async function inviteTeam(
  store: LeagueStore,
  actor: string,
  leagueId: string,
  teamId: string,
) {
  await store.transaction(async (manager) => {
    const leagues = await manager.inviteTeamLockLeague(leagueId);
    assertLeagueInvitation(leagues[0], actor);
    const teamRows = await manager.inviteTeamReadTeamEligibility(teamId);
    assertInvitableTeam(teamRows[0]);
    const registered = await manager.inviteTeamCheckRegistered(
      leagueId,
      teamId,
    );
    assertTeamNotRegistered(registered[0].exists);
    const current = await manager.inviteTeamLockInvitation(leagueId, teamId);
    assertInvitationNotPending(current[0]?.status);
    if (current.length) {
      await manager.inviteTeamReopenInvitation(current[0].id, actor);
    } else {
      await manager.inviteTeamInsertInvitation(leagueId, teamId, actor);
    }
  });
}
