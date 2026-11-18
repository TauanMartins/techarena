import { deviceLocation } from '../features/arenas/hooks/device-location';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Session } from '@supabase/supabase-js';
import { AuthContext } from './AuthContext';
import { api } from '../lib/api-client';
import { queryClient, queryKeys } from '../lib/query-client';
import { isSupabaseConfigured, supabase } from '../lib/supabase-client';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(Boolean(supabase));
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    let active = true;
    void supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (error) throw error;
        if (active) {
          setSession(data.session);
        }
      })
      .catch(() => {
        if (active) {
          setAuthError(
            'Não foi possível restaurar seu acesso. Tente novamente.',
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!nextSession) {
        queryClient.clear();
        deviceLocation.set(null);
      }
      setSession(nextSession);
      setAuthError(null);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const profileQuery = useQuery({
    queryKey: queryKeys.profile(session?.user.id ?? ''),
    queryFn: () => api.getProfile(session!.access_token),
    enabled: Boolean(session),
  });
  const refetchProfile = profileQuery.refetch;
  const refreshProfile = useCallback(async () => {
    if (session) await refetchProfile();
  }, [refetchProfile, session]);

  const loginWithGoogle = useCallback(async () => {
    if (!supabase || !isSupabaseConfigured) {
      throw new Error(
        'O login está indisponível no momento. Tente novamente mais tarde.',
      );
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (error)
      throw new Error('Não foi possível iniciar o login. Tente novamente.');
  }, []);

  const logout = useCallback(async () => {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error)
      throw new Error('Não foi possível encerrar sua sessão. Tente novamente.');
  }, []);

  const value = useMemo(
    () => ({
      session,
      profile: profileQuery.data ?? null,
      loading,
      profileLoading: Boolean(session) && profileQuery.isPending,
      authError,
      profileError: profileQuery.error
        ? 'Não foi possível carregar os dados do seu perfil.'
        : null,
      configured: isSupabaseConfigured,
      loginWithGoogle,
      logout,
      refreshProfile,
    }),
    [
      session,
      loading,
      profileQuery.data,
      profileQuery.isPending,
      authError,
      profileQuery.error,
      loginWithGoogle,
      logout,
      refreshProfile,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
