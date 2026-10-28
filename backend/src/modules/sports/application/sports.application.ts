import type { PageRequest } from '../../../common/domain/pagination.js';
import { assertPageRequest } from '../../../common/domain/pagination.js';
import type { SportsQuery, SportsRepository } from '../domain/sports.port.js';
export class SportsApplication {
  constructor(private readonly repository: SportsRepository) {}
  list(query: SportsQuery) {
    assertPageRequest(query);
    return this.repository.list(query);
  }
  forArena(arenaId: string, query: PageRequest) {
    assertPageRequest(query);
    return this.repository.forArena(arenaId, query);
  }
  materials(sportId: string, query: PageRequest) {
    assertPageRequest(query);
    return this.repository.materials(sportId, query);
  }
}
