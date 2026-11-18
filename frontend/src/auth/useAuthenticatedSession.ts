import { useAuth } from './useAuth';

/** For protected screens; Authorization remains centralized in apiRequest. */
export function useAuthenticatedSession() {
  const auth = useAuth();
  if (!auth.session) throw new Error('Sua sessão expirou. Entre novamente.');
  return {
    ...auth,
    session: auth.session,
    token: auth.session.access_token,
    userId: auth.session.user.id,
  };
}
