import { assertLeagueInvitationResponse } from '../../domain/assert-league-invitation-response.js';
import type { LeagueStore } from '../ports/league-store.port.js';

export async function respondToTeamInvitation(
  store: LeagueStore,
  actor: string,
  invitationId: string,
  action: 'accept' | 'decline',
) {
  await store.transaction(async (manager) => {
    const rows = await manager.respondToTeamInvitationLockInvitation(
      invitationId,
      actor,
    );
    const invitation = assertLeagueInvitationResponse(rows[0]);
    if (action === 'accept') {
      await manager.respondToTeamInvitationRegisterTeam(
        invitation.teamId,
        invitation.leagueId,
      );
    }
    await manager.respondToTeamInvitationSetStatus(
      invitationId,
      action === 'accept' ? 'accepted' : 'declined',
    );
  });
}
