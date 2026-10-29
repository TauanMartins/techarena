import { assertPageRequest } from '../../../common/domain/pagination.js';
import type { PageRequest } from '../../../common/domain/pagination.js';
import type { ProfileAccess } from '../../users/profile/application/profile-access.port.js';
import type {
  MembershipDecision,
  TeamInput,
  TeamQuery,
  TeamsRepository,
} from '../domain/teams.port.js';
export class TeamCatalogApplication {
  constructor(private readonly repository: TeamsRepository) {}
  list(query: TeamQuery) {
    assertPageRequest(query);
    return this.repository.list(query);
  }
  async exists(name: string) {
    return { exists: await this.repository.exists(name.trim()) };
  }
}
export class TeamManagementApplication {
  constructor(
    private readonly repository: TeamsRepository,
    private readonly profiles: ProfileAccess,
  ) {}
  async create(actor: string, input: TeamInput) {
    await this.profiles.ensureAdult(actor);
    return this.repository.create(actor, { ...input, name: input.name.trim() });
  }
  async update(actor: string, id: string, input: TeamInput) {
    await this.profiles.ensureExists(actor);
    return this.repository.update(actor, id, {
      ...input,
      name: input.name.trim(),
    });
  }
}
export class TeamRequestsApplication {
  constructor(
    private readonly repository: TeamsRepository,
    private readonly profiles: ProfileAccess,
  ) {}
  async invite(actor: string, teamId: string, userId: string) {
    await this.profiles.ensureExists(actor);
    return this.repository.invite(actor, teamId, userId);
  }
  async decide(
    actor: string,
    teamId: string,
    userId: string,
    decision: MembershipDecision,
  ) {
    await this.profiles.ensureExists(actor);
    return this.repository.decideRequest(actor, teamId, userId, decision);
  }
  async request(actor: string, teamId: string) {
    await this.profiles.ensureAdult(actor);
    return this.repository.requestJoin(actor, teamId);
  }
  async respond(actor: string, id: string, decision: MembershipDecision) {
    if (decision === 'accept') await this.profiles.ensureAdult(actor);
    else await this.profiles.ensureExists(actor);
    return this.repository.respondInvitation(actor, id, decision);
  }
  async list(actor: string, query: PageRequest, teamId?: string) {
    await this.profiles.ensureExists(actor);
    assertPageRequest(query);
    return this.repository.requests(actor, query, teamId);
  }

  async members(teamId: string, query: PageRequest) {
    assertPageRequest(query);
    return this.repository.members(teamId, query);
  }
}
