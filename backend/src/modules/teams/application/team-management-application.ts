import type { ChatAccessPort } from '../../chat/application/ports/chat-access.port.js';
import { assertMemberRemoval } from '../domain/assert-member-removal.js';
import { assertTeamDeletion } from '../domain/assert-team-deletion.js';
import type { ProfileAccess } from '../../users/profile/application/ports/profile-access.port.js';
import type { TeamsRepository } from './ports/teams.port.js';
import {
  assertCaptain,
  assertTeamExists,
  normalizeTeam,
} from '../domain/team-policy.js';
import type { TeamInput } from '../domain/team.js';

export class TeamManagementApplication {
  constructor(
    private readonly repository: TeamsRepository,
    private readonly profiles: ProfileAccess,
    private readonly chat: ChatAccessPort,
  ) {}
  async removeMember(actor: string, teamId: string, userId: string) {
    await this.profiles.ensureExists(actor);
    await this.repository.transaction(async (store) => {
      assertTeamExists(await store.lockTeam(teamId));
      assertMemberRemoval(
        actor,
        userId,
        await store.isCaptain(actor, teamId),
        await store.isCaptain(userId, teamId),
        await store.isMember(userId, teamId),
      );
      await store.removeMember(teamId, userId);
      await this.chat.revokeParticipant(`team:${teamId}`, userId);
    });
    // Repeat after commit to revoke grants racing the membership transaction.
    await this.chat.revokeParticipant(`team:${teamId}`, userId);
    return { success: true };
  }
  async remove(actor: string, teamId: string) {
    await this.profiles.ensureExists(actor);
    const removedMembers = await this.repository.transaction(async (store) => {
      assertTeamExists(await store.lockTeam(teamId));
      assertTeamDeletion(
        await store.isCaptain(actor, teamId),
        await store.hasActiveCompetitions(teamId),
      );
      const members = await store.memberIds(teamId);
      await store.removeTeam(teamId);
      await Promise.all(
        members.map((id) => this.chat.revokeParticipant(`team:${teamId}`, id)),
      );
      return members;
    });
    await Promise.all(
      removedMembers.map((id) =>
        this.chat.revokeParticipant(`team:${teamId}`, id),
      ),
    );
    return { success: true };
  }
  async create(actor: string, input: TeamInput) {
    await this.profiles.ensureAdult(actor);
    const prepared = normalizeTeam(input);
    return this.repository.transaction(async (store) => {
      const team = await store.createTeam(prepared);
      await store.addMember(team.id, actor, 'captain');
      return team;
    });
  }
  async update(actor: string, id: string, input: TeamInput) {
    await this.profiles.ensureExists(actor);
    const prepared = normalizeTeam(input);
    return this.repository.transaction(async (store) => {
      assertTeamExists(await store.lockTeam(id));
      assertCaptain(await store.isCaptain(actor, id));
      return store.updateTeam(id, prepared);
    });
  }
}
