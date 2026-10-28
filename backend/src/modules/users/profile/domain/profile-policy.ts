import { UserError } from '../../shared/domain/user-error.js';
import type { ProfileChanges } from './profile.js';

/** A birth date must be real and represent an adult; no fabricated default age. */
export function validateBirthDate(value: string, now: Date): void {
  const date = new Date(value + 'T00:00:00.000Z');
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
  ) {
    throw new UserError(
      'invalid',
      'INVALID_BIRTH_DATE',
      'Birth date must be a valid calendar date',
    );
  }
  let age = now.getUTCFullYear() - date.getUTCFullYear();
  if (
    now.getUTCMonth() < date.getUTCMonth() ||
    (now.getUTCMonth() === date.getUTCMonth() &&
      now.getUTCDate() < date.getUTCDate())
  )
    age--;
  if (age < 18)
    throw new UserError(
      'invalid',
      'MINIMUM_AGE',
      'Users must be at least 18 years old',
    );
}

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
    if (!changes.gender || !['M', 'F', 'O'].includes(changes.gender))
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
