import { UserError } from '../../../shared/domain/user-error.js';
export function assertFavoriteSportsExist(requested: number, existing: number) {
  if (requested !== existing)
    throw new UserError(
      'not_found',
      'SPORT_NOT_FOUND',
      'One or more sports do not exist',
    );
}
