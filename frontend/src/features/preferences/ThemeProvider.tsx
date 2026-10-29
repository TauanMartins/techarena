import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useAuth } from '../../auth/AuthProvider';
import { api } from '../../shared/api';

export type ThemePreference = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  theme: ThemePreference;
  error: string | null;
  reloadTheme: () => Promise<void>;
  saveTheme: (theme: ThemePreference) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const [theme, setTheme] = useState<ThemePreference>('system');
  const [error, setError] = useState<string | null>(null);

  const reloadTheme = useCallback(async () => {
    if (!session) return;
    try {
      const saved = await api.getTheme(session.access_token);
      setTheme(saved.theme);
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível carregar o tema da conta.');
    }
  }, [session]);

  const saveTheme = useCallback(async (nextTheme: ThemePreference) => {
    if (!session) throw new Error('Uma sessão autenticada é necessária para alterar o tema.');
    const saved = await api.setTheme(session.access_token, nextTheme);
    setTheme(saved.theme);
    setError(null);
  }, [session]);

  useEffect(() => {
    void reloadTheme();
  }, [reloadTheme]);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const applyTheme = () => {
      const activeTheme = theme === 'system' ? (media.matches ? 'dark' : 'light') : theme;
      document.documentElement.dataset.theme = activeTheme;
    };
    applyTheme();
    media.addEventListener('change', applyTheme);
    return () => media.removeEventListener('change', applyTheme);
  }, [theme]);

  const value = useMemo(() => ({ theme, error, reloadTheme, saveTheme }), [theme, error, reloadTheme, saveTheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemePreference() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useThemePreference deve ser usado dentro de ThemeProvider.');
  return context;
}
