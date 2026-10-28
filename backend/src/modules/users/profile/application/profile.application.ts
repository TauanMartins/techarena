import type { ProfileRepository } from '../domain/profile-repository.port.js';
import { UserError } from '../../shared/domain/user-error.js';
import { ProfileChanges, validateBirthDate } from '../domain/profile.js';

import type { ProfileAccess } from './profile-access.port.js';

export class ProfileApplication implements ProfileAccess {
  constructor(
    private readonly repository: ProfileRepository,
    private readonly now: () => Date = () => new Date(),
  ) {}
  async profile(id: string) {
    const profile = await this.repository.findById(id);
    if (!profile)
      throw new UserError(
        'not_found',
        'PROFILE_NOT_FOUND',
        'The authenticated user profile is not available',
      );
    return profile;
  }
  async updateProfile(id: string, changes: ProfileChanges) {
    await this.profile(id);
    if (Object.values(changes).every((value) => value === undefined))
      throw new UserError(
        'invalid',
        'EMPTY_UPDATE',
        'Provide at least one profile field',
      );
    if (changes.birthDate !== undefined) {
      if (changes.birthDate === null)
        throw new UserError(
          'invalid',
          'INVALID_BIRTH_DATE',
          'Birth date cannot be cleared',
        );
      validateBirthDate(changes.birthDate, this.now());
    }
    return this.repository.update(id, changes);
  }
  async ensureExists(id: string): Promise<void> {
    await this.profile(id);
  }
  async ensureAdult(id: string): Promise<void> {
    const profile = await this.profile(id);
    if (!profile.birthDate)
      throw new UserError(
        'invalid',
        'PROFILE_INCOMPLETE',
        'Provide your birth date before joining an appointment',
      );
    validateBirthDate(profile.birthDate, this.now());
  }
}
