import { assertTheme } from '../domain/assert-theme.js';
import type { ThemeRepository } from './ports/theme-repository.port.js';

import type { Theme } from '../domain/theme.js';

import type { ProfileAccess } from '../../../profile/application/ports/profile-access.port.js';
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
    assertTheme(theme);
    await this.repository.setTheme(id, theme);
    return { theme };
  }
}
