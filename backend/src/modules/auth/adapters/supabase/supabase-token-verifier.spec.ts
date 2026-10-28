import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from 'jose';
import {
  IdentityProviderUnavailable,
  InvalidAccessToken,
} from '../../domain/access-token-verifier.port.js';
import { SupabaseTokenVerifier } from './supabase-token-verifier.js';

const project = 'https://project.supabase.co';
const subject = '11111111-1111-4111-8111-111111111111';
const keys = await generateKeyPair('ES256');
const jwk = await exportJWK(keys.publicKey);
jwk.kid = 'test-key';
const verifier = new SupabaseTokenVerifier(
  project,
  createLocalJWKSet({ keys: [jwk] }),
);
async function token(
  overrides: Record<string, unknown> = {},
  key = keys.privateKey,
) {
  return new SignJWT({
    role: 'authenticated',
    ...overrides,
  })
    .setProtectedHeader({ alg: 'ES256', kid: 'test-key' })
    .setSubject(subject)
    .setIssuer(project + '/auth/v1')
    .setAudience('authenticated')
    .setIssuedAt()
    .setExpirationTime('5m')
    .sign(key);
}

it('verifies signatures and obtains identity from trusted claims', async () => {
  await expect(verifier.verify(await token())).resolves.toMatchObject({
    id: subject,
  });
});
it('rejects forged signatures', async () => {
  const attacker = await generateKeyPair('ES256');
  await expect(
    verifier.verify(await token({}, attacker.privateKey)),
  ).rejects.toBeInstanceOf(InvalidAccessToken);
});
it.each([
  { iss: 'https://other.supabase.co/auth/v1' },
  { aud: 'other' },
  { exp: 1 },
  { role: 'service_role' },
  { is_anonymous: true },
  { sub: 'invalid' },
])('rejects invalid token claims: %j', async (claims) => {
  const jwt = await new SignJWT({
    role: 'authenticated',
    sub: subject,
    iss: project + '/auth/v1',
    aud: 'authenticated',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 300,
    ...claims,
  })
    .setProtectedHeader({ alg: 'ES256', kid: 'test-key' })
    .sign(keys.privateKey);
  await expect(verifier.verify(jwt)).rejects.toBeInstanceOf(InvalidAccessToken);
});
it('fails closed while project configuration is missing', async () => {
  await expect(
    new SupabaseTokenVerifier(null).verify(await token()),
  ).rejects.toBeInstanceOf(IdentityProviderUnavailable);
});
