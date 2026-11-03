import { useCallback, useEffect, useMemo, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../auth/useAuth';
import { settingsApi } from '../settings/api/settings.api';
import { queryKeys } from '../../lib/query-client';
import { ThemeContext, type ThemePreference } from './ThemeContext';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const themeQuery = useQuery({
    queryKey: queryKeys.theme(session?.user.id ?? ''),
    queryFn: () => settingsApi.theme(session!.access_token),
    enabled: Boolean(session),
  });
  const saveThemeMutation = useMutation({
    mutationFn: (nextTheme: ThemePreference) => {
      if (!session) throw new Error('Entre na sua conta para alterar o tema.');
      return settingsApi.setTheme(session.access_token, nextTheme);
    },
    onSuccess: (saved) => {
      queryClient.setQueryData(queryKeys.theme(session!.user.id), saved);
    },
  });
  const mutateTheme = saveThemeMutation.mutateAsync;
  const theme = themeQuery.data?.theme ?? 'system';
  const refetchTheme = themeQuery.refetch;
  const themeError = themeQuery.error;
  const saveTheme = useCallback(async (nextTheme: ThemePreference) => {
    await mutateTheme(nextTheme);
  }, [mutateTheme]);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const applyTheme = () => {
      const activeTheme =
        theme === 'system' ? (media.matches ? 'dark' : 'light') : theme;
      document.documentElement.dataset.theme = activeTheme;
    };
    applyTheme();
    media.addEventListener('change', applyTheme);
    return () => media.removeEventListener('change', applyTheme);
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      error: themeError
        ? themeError instanceof Error
          ? themeError.message
          : 'Não foi possível carregar o tema da conta.'
        : null,
      reloadTheme: async () => {
        await refetchTheme();
      },
      saveTheme,
    }),
    [saveTheme, theme, themeError, refetchTheme],
  );
  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
