import { UserError } from '../../shared/domain/user-error.js';
import type { ProfileChanges } from './profile.js';
import { validateBirthDate } from './validate-birth-date.js';
export function prepareProfileChanges(
  changes: ProfileChanges,
  now: Date,
): ProfileChanges {
  const fields = ['name', 'username', 'birthDate', 'gender', 'image'];
  if (Object.keys(changes).some((key) => !fields.includes(key)))
    throw new UserError(
      'invalid',
      'INVALID_PROFILE_FIELD',
      'This profile field cannot be changed',
    );
  const result: ProfileChanges = {};
  function invalid(field: string): never {
    throw new UserError('invalid', 'INVALID_PROFILE_FIELD', `Invalid ${field}`);
  }
  if (changes.name !== undefined) {
    if (typeof changes.name !== 'string') invalid('name');
    const name = changes.name.trim();
    if (!name || name.length > 150) invalid('name');
    result.name = name;
  }
  if (changes.username !== undefined) {
    if (typeof changes.username !== 'string') invalid('username');
    const username = changes.username.trim();
    if (!/^[a-z0-9_]{3,45}$/.test(username)) invalid('username');
    result.username = username;
  }
  if (changes.birthDate !== undefined) {
    if (changes.birthDate === null) invalid('birthDate');
    validateBirthDate(changes.birthDate, now);
    result.birthDate = changes.birthDate;
  }
  if (changes.gender !== undefined) {
    if (changes.gender !== null && !['M', 'F', 'O'].includes(changes.gender))
      invalid('gender');
    result.gender = changes.gender;
  }
  if (changes.image !== undefined) {
    if (changes.image !== null) {
      if (typeof changes.image !== 'string' || changes.image.length > 150)
        invalid('image');
      try {
        if (new URL(changes.image).protocol !== 'https:') invalid('image');
      } catch {
        invalid('image');
      }
    }
    result.image = changes.image;
  }
  if (!Object.keys(result).length)
    throw new UserError(
      'invalid',
      'EMPTY_UPDATE',
      'Provide at least one profile field',
    );
  return result;
}
