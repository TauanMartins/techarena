import { createContext } from 'react';

export type ThemePreference = 'light' | 'dark' | 'system';

export interface ThemeContextValue {
  theme: ThemePreference;
  error: string | null;
  reloadTheme: () => Promise<void>;
  saveTheme: (theme: ThemePreference) => Promise<void>;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);
