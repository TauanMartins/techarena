import { assertPageRequest } from '../../../common/domain/pagination.js';
import type { TeamsRepository } from './ports/teams.port.js';
import type { TeamQuery } from '../domain/team.js';

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
