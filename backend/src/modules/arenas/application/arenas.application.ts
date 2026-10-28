import { DomainError } from '../../../common/domain/domain-error.js';
import { assertGeo } from '../../../common/domain/geo.js';
import { assertPageRequest } from '../../../common/domain/pagination.js';
import type { ProfileAccess } from '../../users/profile/application/profile-access.port.js';
import type {
  ArenaInput,
  ArenaQuery,
  ArenasRepository,
} from '../domain/arenas.port.js';
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
  private validate(input: ArenaInput) {
    assertGeo(input);
    if (
      !input.address.trim() ||
      input.address.trim().length > 150 ||
      !input.sportIds.length ||
      new Set(input.sportIds).size !== input.sportIds.length
    )
      throw new DomainError(
        'invalid',
        'INVALID_ARENA',
        'Provide an address and distinct supported sports',
      );
    return { ...input, address: input.address.trim() };
  }
  async create(actor: string, input: ArenaInput) {
    await this.profiles.ensureAdmin(actor);
    return this.repository.create(this.validate(input));
  }
  async update(actor: string, id: string, input: ArenaInput) {
    await this.profiles.ensureAdmin(actor);
    return this.repository.update(id, this.validate(input));
  }
}
