export interface AuthenticatedUser {
  readonly id: string;
  readonly email: string | null;
  readonly displayName: string | null;
}

export const ACCESS_TOKEN_VERIFIER = Symbol('ACCESS_TOKEN_VERIFIER');
export interface AccessTokenVerifier {
  verify(token: string): Promise<AuthenticatedUser>;
}
export class InvalidAccessToken extends Error {}
export class IdentityProviderUnavailable extends Error {}
