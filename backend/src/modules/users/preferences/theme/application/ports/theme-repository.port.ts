import type { Theme } from '../../domain/theme.js';

export const THEME_REPOSITORY = Symbol('THEME_REPOSITORY');
export interface ThemeRepository {
  getTheme(id: string): Promise<Theme>;
  setTheme(id: string, theme: Theme): Promise<void>;
}
