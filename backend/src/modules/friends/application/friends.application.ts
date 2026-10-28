import { DomainError } from '../../../common/domain/domain-error.js';
import { assertPageRequest } from '../../../common/domain/pagination.js';
import type { PageRequest } from '../../../common/domain/pagination.js';
import type { ProfileAccess } from '../../users/profile/application/profile-access.port.js';
import type { FriendsRepository } from '../domain/friends.port.js';
export class FriendsApplication {
  constructor(
    private readonly repository: FriendsRepository,
    private readonly profiles: ProfileAccess,
  ) {}
  async list(actor: string, query: PageRequest) {
    await this.profiles.ensureExists(actor);
    assertPageRequest(query);
    return this.repository.list(actor, query);
  }
  async request(actor: string, userId: string) {
    await this.profiles.ensureExists(actor);
    if (actor === userId)
      throw new DomainError(
        'invalid',
        'SELF_FRIENDSHIP',
        'You cannot add yourself',
      );
    return this.repository.request(actor, userId);
  }
  async decide(actor: string, id: string, action: 'accept' | 'block') {
    await this.profiles.ensureExists(actor);
    return this.repository.decide(actor, id, action);
  }
}
