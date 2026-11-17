import type { JWTVerifyGetKey } from 'jose';
import { createRemoteJWKSet, errors, jwtVerify } from 'jose';
import type {
  AccessTokenVerifier,
  AuthenticatedUser,
} from '../../domain/access-token-verifier.port.js';
import {
  IdentityProviderUnavailable,
  InvalidAccessToken,
} from '../../domain/access-token-verifier.port.js';

export class SupabaseTokenVerifier implements AccessTokenVerifier {
  private readonly keySet?: JWTVerifyGetKey;
  private readonly issuer?: string;

  constructor(projectUrl: string | null, keySet?: JWTVerifyGetKey) {
    if (projectUrl) {
      this.issuer = `${projectUrl}/auth/v1`;
      this.keySet =
        keySet ??
        createRemoteJWKSet(new URL(`${this.issuer}/.well-known/jwks.json`), {
          timeoutDuration: 5000,
          cacheMaxAge: 600000,
          cooldownDuration: 30000,
        });
    }
  }

  async verify(token: string): Promise<AuthenticatedUser> {
    if (!this.keySet || !this.issuer) throw new IdentityProviderUnavailable();
    try {
      const { payload } = await jwtVerify(token, this.keySet, {
        issuer: this.issuer,
        audience: 'authenticated',
        algorithms: ['ES256', 'RS256'],
        requiredClaims: ['sub', 'exp', 'iat', 'role'],
        clockTolerance: 5,
      });
      if (
        !payload.sub ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          payload.sub,
        ) ||
        payload.role !== 'authenticated' ||
        payload.is_anonymous === true
      )
        throw new InvalidAccessToken();
      return { id: payload.sub };
    } catch (error) {
      if (error instanceof InvalidAccessToken) throw error;
      if (
        error instanceof errors.JWKSTimeout ||
        !(error instanceof errors.JOSEError)
      )
        throw new IdentityProviderUnavailable();
      throw new InvalidAccessToken();
    }
  }
}
