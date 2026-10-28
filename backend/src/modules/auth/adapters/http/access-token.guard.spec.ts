import type { ExecutionContext } from '@nestjs/common';
import {
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AccessTokenGuard } from './access-token.guard.js';
import {
  IdentityProviderUnavailable,
  InvalidAccessToken,
} from '../../domain/access-token-verifier.port.js';

function fixture(authorization?: string, isPublic = false) {
  const request = { headers: { authorization }, user: undefined };
  const reflector = {
    getAllAndOverride: () => isPublic,
  } as unknown as Reflector;
  const verifier = { verify: vi.fn().mockResolvedValue({ id: 'verified' }) };
  const context = {
    getHandler: () => null,
    getClass: () => null,
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
  return {
    guard: new AccessTokenGuard(reflector, verifier),
    request,
    context,
    verifier,
  };
}
it.each([undefined, '', 'Basic token', 'Bearer a,b', 'Bearer a b'])(
  'rejects missing or malformed authorization: %s',
  async (header) => {
    const { guard, context, verifier } = fixture(header);
    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(verifier.verify).not.toHaveBeenCalled();
  },
);
it('protects routes by default and attaches only verified identity', async () => {
  const { guard, context, request } = fixture('Bearer token');
  await expect(guard.canActivate(context)).resolves.toBe(true);
  expect(request.user).toEqual({ id: 'verified' });
});
it('allows only explicitly public handlers without authentication', async () => {
  const { guard, context, verifier } = fixture(undefined, true);
  await expect(guard.canActivate(context)).resolves.toBe(true);
  expect(verifier.verify).not.toHaveBeenCalled();
});
it.each([
  [new InvalidAccessToken(), UnauthorizedException],
  [new IdentityProviderUnavailable(), ServiceUnavailableException],
])('maps verifier failures to HTTP errors', async (error, expected) => {
  const { guard, context, verifier } = fixture('Bearer token');
  verifier.verify.mockRejectedValue(error);
  await expect(guard.canActivate(context)).rejects.toBeInstanceOf(expected);
});
