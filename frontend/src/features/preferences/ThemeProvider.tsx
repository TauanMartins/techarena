import { useEffect, useMemo, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../auth/useAuth';
import { api } from '../../shared/api';
import { queryKeys } from '../../shared/queryClient';
import { ThemeContext, type ThemePreference } from './ThemeContext';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const themeQuery = useQuery({
    queryKey: queryKeys.theme(session?.user.id ?? ''),
    queryFn: () => api.getTheme(session!.access_token),
    enabled: Boolean(session),
  });
  const saveThemeMutation = useMutation({
    mutationFn: (nextTheme: ThemePreference) => {
      if (!session) throw new Error('Entre na sua conta para alterar o tema.');
      return api.setTheme(session.access_token, nextTheme);
    },
    onSuccess: (saved) => {
      queryClient.setQueryData(queryKeys.theme(session!.user.id), saved);
    },
  });
  const theme = themeQuery.data?.theme ?? 'system';
  const saveTheme = async (nextTheme: ThemePreference) => {
    await saveThemeMutation.mutateAsync(nextTheme);
  };

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
      error: themeQuery.error
        ? themeQuery.error instanceof Error
          ? themeQuery.error.message
          : 'Não foi possível carregar o tema da conta.'
        : null,
      reloadTheme: async () => {
        await themeQuery.refetch();
      },
      saveTheme,
    }),
    [saveTheme, theme, themeQuery.error, themeQuery.refetch],
  );
  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
