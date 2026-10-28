import type { ProfileRepository } from '../domain/profile-repository.port.js';
import { UserError } from '../../shared/domain/user-error.js';
import type { ProfileChanges } from '../domain/profile.js';
import {
  prepareProfileChanges,
  validateBirthDate,
} from '../domain/profile-policy.js';

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
    await this.ensureExists(id);
    const normalized = prepareProfileChanges(changes, this.now());
    return this.repository.update(id, normalized);
  }

  async ensureExists(id: string): Promise<void> {
    if (!(await this.repository.exists(id)))
      throw new UserError(
        'not_found',
        'PROFILE_NOT_FOUND',
        'The authenticated user profile is not available',
      );
  }
  async ensureAdult(id: string): Promise<void> {
    const profile = await this.repository.findBirthDate(id);
    if (!profile)
      throw new UserError(
        'not_found',
        'PROFILE_NOT_FOUND',
        'The authenticated user profile is not available',
      );
    if (!profile.birthDate)
      throw new UserError(
        'invalid',
        'PROFILE_INCOMPLETE',
        'Provide your birth date before joining an appointment',
      );
    validateBirthDate(profile.birthDate, this.now());
  }
}
