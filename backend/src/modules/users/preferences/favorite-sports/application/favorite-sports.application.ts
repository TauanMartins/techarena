import { isInt64Identifier } from '../../../../../common/domain/int64-identifier.js';
import {
  MAX_FAVORITE_SPORTS,
  favoriteSportsResult,
} from '../domain/favorite-sports.js';
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
    return favoriteSportsResult(await this.repository.getSports(id));
  }
  async replaceSports(id: string, sportIds: string[]) {
    await this.profiles.ensureExists(id);
    if (
      sportIds.length > MAX_FAVORITE_SPORTS ||
      new Set(sportIds).size !== sportIds.length ||
      sportIds.some((value) => !isInt64Identifier(value))
    ) {
      throw new UserError(
        'invalid',
        'INVALID_FAVORITE_SPORTS',
        `Choose up to ${MAX_FAVORITE_SPORTS} distinct sports`,
      );
    }
    return favoriteSportsResult(
      await this.repository.replaceSports(id, sportIds),
    );
  }
}
