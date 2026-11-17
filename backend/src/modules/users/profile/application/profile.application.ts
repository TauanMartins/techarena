import { UserError } from '../../shared/domain/user-error.js';
import {
  prepareProfileChanges,
  validateBirthDate,
} from '../domain/profile-policy.js';
import type { ProfileChanges } from '../domain/profile.js';
import type { ProfileRepository } from './ports/profile-repository.port.js';

import type { ProfileAccess } from './ports/profile-access.port.js';

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

  async ensureAdmin(id: string): Promise<void> {
    const profile = await this.profile(id);
    if (profile.permission !== 'admin')
      throw new UserError(
        'forbidden',
        'ADMIN_REQUIRED',
        'Administrator access is required',
      );
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
