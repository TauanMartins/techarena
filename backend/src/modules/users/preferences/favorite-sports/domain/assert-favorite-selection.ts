import { isInt64Identifier } from '../../../../../common/domain/int64-identifier.js';
import { UserError } from '../../../shared/domain/user-error.js';
import { MAX_FAVORITE_SPORTS } from './favorite-sports.js';
export function assertFavoriteSelection(sportIds: string[]) {
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
}
