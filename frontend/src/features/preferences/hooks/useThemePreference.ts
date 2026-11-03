import { use } from 'react';
import { ThemeContext } from '../ThemeContext';

export function useThemePreference() {
  const context = use(ThemeContext);
  if (!context)
    throw new Error(
      'useThemePreference deve ser usado dentro de ThemeProvider.',
    );
  return context;
}
