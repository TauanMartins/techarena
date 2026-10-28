export interface UserProfile {
  id: string;
  name: string | null;
  email: string | null;
  permission: string | null;
  username: string | null;
  birthDate: string | null;
  gender: string | null;
  image: string | null;
  createdAt: Date;
}
export type ProfileChanges = Partial<
  Pick<UserProfile, 'name' | 'username' | 'birthDate' | 'gender' | 'image'>
>;

import { UserError } from '../../shared/domain/user-error.js';
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
