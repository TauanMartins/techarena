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
  ) {}
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
