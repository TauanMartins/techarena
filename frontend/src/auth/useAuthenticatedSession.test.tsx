import { renderHook } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { useAuthenticatedSession } from './useAuthenticatedSession';
const auth = vi.hoisted(() => ({
  session: { access_token: 'first', user: { id: 'athlete' } },
}));
vi.mock('./useAuth', () => ({ useAuth: () => auth }));
it('uses refreshed credentials while preserving the user identity used for cache isolation', () => {
  const { result, rerender } = renderHook(useAuthenticatedSession);
  expect(result.current.token).toBe('first');
  auth.session = { access_token: 'renewed', user: { id: 'athlete' } };
  rerender();
  expect(result.current.token).toBe('renewed');
  expect(result.current.userId).toBe('athlete');
});
