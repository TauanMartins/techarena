import {
  normalizeArena,
  assertArenaExists,
  planArenaSports,
} from '../domain/arena-policy.js';
import { assertGeo } from '../../../common/domain/geo.js';
import { assertPageRequest } from '../../../common/domain/pagination.js';
import type { ProfileAccess } from '../../users/profile/application/profile-access.port.js';
import type { ArenasRepository } from '../application/arenas.port.js';
import type { ArenaInput, ArenaQuery } from '../domain/arena.js';
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
export class ArenaManagementApplication {
  constructor(
    private readonly repository: ArenasRepository,
    private readonly profiles: ProfileAccess,
  ) {}
  private persist(input: ArenaInput, id?: string) {
    const prepared = normalizeArena(input);
    return this.repository.transaction(async (store) => {
      if (id) assertArenaExists(await store.lock(id));
      const previous = id ? await store.existingSports(id) : [];
      const changes = planArenaSports(
        previous,
        prepared.sportIds,
        await store.countSports(prepared.sportIds),
      );
      const arenaId = await store.save(prepared, id);
      if (changes.remove.length)
        await store.removeSports(arenaId, changes.remove);
      if (changes.add.length) await store.addSports(arenaId, changes.add);
      return store.present(arenaId, prepared.sportIds);
    });
  }
  async create(actor: string, input: ArenaInput) {
    await this.profiles.ensureAdmin(actor);
    return this.persist(input);
  }
  async update(actor: string, id: string, input: ArenaInput) {
    await this.profiles.ensureAdmin(actor);
    return this.persist(input, id);
  }
}
