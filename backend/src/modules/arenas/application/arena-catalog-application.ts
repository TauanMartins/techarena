import { assertGeo } from '../../../common/domain/geo.js';
import { assertPageRequest } from '../../../common/domain/pagination.js';
import type { ProfileAccess } from '../../users/profile/application/ports/profile-access.port.js';
import type { ArenasRepository } from './ports/arenas.port.js';
import type { ArenaQuery } from '../domain/arena.js';

export class ArenaCatalogApplication {
  constructor(
    private readonly repository: ArenasRepository,
    private readonly profiles: ProfileAccess,
  ) {}
  async list(actor: string, query: ArenaQuery, admin = false) {
    if (admin) await this.profiles.ensureAdmin(actor);
    assertPageRequest(query);
    assertGeo(query);
    return this.repository.list(query, admin);
  }
}
