import type { UserRepository } from '../domain/user-repository.port.js';
import { UserError, validateBirthDate } from '../domain/user.js';
import type {
  PageRequest,
  ProfileChanges,
  ProfileIdentity,
  Theme,
} from '../domain/user.js';

/** Use cases depend only on domain types and ports, never NestJS or TypeORM. */
export class UserApplication {
  constructor(
    private readonly repository: UserRepository,
    private readonly now: () => Date = () => new Date(),
  ) {}

  provision(identity: ProfileIdentity) {
    if (
      identity.email &&
      (identity.email.length > 150 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identity.email))
    ) {
      throw new UserError(
        'invalid',
        'INVALID_IDENTITY_EMAIL',
        'The identity email cannot be stored in this schema',
      );
    }
    return this.repository.provision({
      ...identity,
      displayName: identity.displayName?.trim().slice(0, 150) || null,
    });
  }
  async profile(id: string) {
    const profile = await this.repository.findById(id);
    if (!profile)
      throw new UserError(
        'not_found',
        'PROFILE_NOT_FOUND',
        'Initialize your profile with POST /users/me',
      );
    return profile;
  }
  search(search: string, pagination: PageRequest) {
    return this.repository.search(search, pagination);
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
  async theme(id: string) {
    await this.profile(id);
    return { theme: await this.repository.getTheme(id) };
  }
  async setTheme(id: string, theme: Theme) {
    await this.profile(id);
    if (!['light', 'dark', 'system'].includes(theme))
      throw new UserError('invalid', 'INVALID_THEME', 'Invalid theme');
    await this.repository.setTheme(id, theme);
    return { theme };
  }
  async sports(id: string) {
    await this.profile(id);
    return { items: await this.repository.getSports(id) };
  }
  async replaceSports(id: string, sportIds: string[]) {
    await this.profile(id);
    if (
      sportIds.length > 4 ||
      new Set(sportIds).size !== sportIds.length ||
      sportIds.some((value) => !/^[1-9]\d*$/.test(value))
    ) {
      throw new UserError(
        'invalid',
        'INVALID_FAVORITE_SPORTS',
        'Choose up to four distinct sports',
      );
    }
    return { items: await this.repository.replaceSports(id, sportIds) };
  }
  async teams(id: string, pagination: PageRequest) {
    await this.profile(id);
    return this.repository.getTeams(id, pagination);
  }
  async appointments(id: string, pagination: PageRequest) {
    await this.profile(id);
    return this.repository.getAppointments(id, pagination);
  }
  async joinAppointment(id: string, appointmentId: string, holder: boolean) {
    const profile = await this.profile(id);
    if (!profile.birthDate)
      throw new UserError(
        'invalid',
        'PROFILE_INCOMPLETE',
        'Provide your birth date before joining an appointment',
      );
    validateBirthDate(profile.birthDate, this.now());
    return this.repository.joinAppointment(
      id,
      appointmentId,
      holder,
      this.now(),
    );
  }
}
