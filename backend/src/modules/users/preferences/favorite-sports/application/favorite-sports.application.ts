import type { FavoriteSportsRepository } from '../domain/favorite-sports-repository.port.js';
import { UserError } from '../../../shared/domain/user-error.js';

import type { ProfileAccess } from '../../../profile/application/profile-access.port.js';
export class FavoriteSportsApplication {
  constructor(
    private readonly repository: FavoriteSportsRepository,
    private readonly profiles: ProfileAccess,
  ) {}
  async sports(id: string) {
    await this.profiles.ensureExists(id);
    return { items: await this.repository.getSports(id) };
  }
  async replaceSports(id: string, sportIds: string[]) {
    await this.profiles.ensureExists(id);
    if (
      sportIds.length > 4 ||
      new Set(sportIds).size !== sportIds.length ||
      sportIds.some((value) => !/^[1-9]\d*$/.test(value))
    ) {
      throw new UserError(
        'invalid',
        'INVALID_FAVORITE_SPORTS',
        'Choose up to four distinct sports',
      );
    }
    return { items: await this.repository.replaceSports(id, sportIds) };
  }
}
