import type { ThemeRepository } from '../domain/theme-repository.port.js';
import { UserError } from '../../../shared/domain/user-error.js';

import type { Theme } from '../domain/theme.js';

import type { ProfileAccess } from '../../../profile/application/profile-access.port.js';
export class ThemeApplication {
  constructor(
    private readonly repository: ThemeRepository,
    private readonly profiles: ProfileAccess,
  ) {}
  async theme(id: string) {
    await this.profiles.ensureExists(id);
    return { theme: await this.repository.getTheme(id) };
  }
  async setTheme(id: string, theme: Theme) {
    await this.profiles.ensureExists(id);
    if (!['light', 'dark', 'system'].includes(theme))
      throw new UserError('invalid', 'INVALID_THEME', 'Invalid theme');
    await this.repository.setTheme(id, theme);
    return { theme };
  }
}
