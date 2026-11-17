import { UserError } from '../../../shared/domain/user-error.js';
import { assertFavoriteSelection } from '../domain/assert-favorite-selection.js';
import { assertFavoriteSportsExist } from '../domain/assert-favorite-sports-exist.js';
import { favoriteSportsResult } from '../domain/favorite-sports.js';
import type { FavoriteSportsRepository } from './ports/favorite-sports-repository.port.js';

import type { ProfileAccess } from '../../../profile/application/ports/profile-access.port.js';
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
    assertFavoriteSelection(sportIds);
    return this.repository.transaction(async (store) => {
      if (!(await store.lockOwner(id)))
        throw new UserError(
          'not_found',
          'PROFILE_NOT_FOUND',
          'Profile not found',
        );
      assertFavoriteSportsExist(
        sportIds.length,
        await store.countSports(sportIds),
      );
      await store.replace(id, sportIds);
      return favoriteSportsResult(await store.sports(id));
    });
  }
}
