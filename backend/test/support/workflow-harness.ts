import { Test } from '@nestjs/testing';
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from 'jose';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../../src/app.module.js';
import { configureHttp } from '../../src/bootstrap/configure-http.js';
import { loadConfiguration } from '../../src/config/environment.js';
import { ACCESS_TOKEN_VERIFIER } from '../../src/modules/auth/domain/access-token-verifier.port.js';
import { SupabaseTokenVerifier } from '../../src/modules/auth/adapters/supabase/supabase-token-verifier.js';
import { CHAT_ACCESS } from '../../src/modules/chat/application/ports/chat-access.port.js';
import {
  Arena,
  Permission,
  Schedule,
  SportArena,
  User,
} from '../../src/database/entities/index.js';
export const actors = {
  alice: '11111111-1111-4111-8111-111111111111',
  bob: '22222222-2222-4222-8222-222222222222',
  admin: '33333333-3333-4333-8333-333333333333',
  carol: '44444444-4444-4444-8444-444444444444',
};
export type Actor = keyof typeof actors;
export async function workflowHarness() {
  const configuration = loadConfiguration();
  if (!new URL(configuration.database.url).pathname.endsWith('_test'))
    throw new Error('Workflow integration requires a dedicated _test database');
  const keys = await generateKeyPair('ES256');
  const jwk = await exportJWK(keys.publicKey);
  jwk.kid = 'workflow';
  const verifier = new SupabaseTokenVerifier(
    'https://project.supabase.co',
    createLocalJWKSet({ keys: [jwk] }),
  );
  const chatAccess = {
    ensureAccess: vi
      .fn()
      .mockRejectedValue(
        new Error('Chat access is not configured in this harness'),
      ),
    revokeParticipant: vi.fn().mockResolvedValue(undefined),
  };
  const module = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(ACCESS_TOKEN_VERIFIER)
    .useValue(verifier)
    .overrideProvider(CHAT_ACCESS)
    .useValue(chatAccess)
    .compile();
  const app = module.createNestApplication();
  configureHttp(app, configuration);
  await app.init();
  const db = app.get(DataSource);
  const tokens = {} as Record<Actor, string>;
  for (const [name, id] of Object.entries(actors))
    tokens[name as Actor] = await new SignJWT({ role: 'authenticated' })
      .setProtectedHeader({ alg: 'ES256', kid: 'workflow' })
      .setSubject(id)
      .setIssuer('https://project.supabase.co/auth/v1')
      .setAudience('authenticated')
      .setIssuedAt()
      .setExpirationTime('30m')
      .sign(keys.privateKey);
  const raw = () => request(app.getHttpServer());
  return {
    chatAccess,
    db,
    app,
    raw,
    get: (path: string, actor: Actor = 'alice') =>
      raw().get(path).auth(tokens[actor], { type: 'bearer' }),
    post: (path: string, actor: Actor = 'alice') =>
      raw().post(path).auth(tokens[actor], { type: 'bearer' }),
    delete: (path: string, actor: Actor = 'alice') =>
      raw().delete(path).auth(tokens[actor], { type: 'bearer' }),
    put: (path: string, actor: Actor = 'alice') =>
      raw().put(path).auth(tokens[actor], { type: 'bearer' }),
    async reset() {
      chatAccess.revokeParticipant.mockClear();
      await db.query(
        'TRUNCATE public.users,public.team,public.arena RESTART IDENTITY CASCADE',
      );
      const user = await db
        .getRepository(Permission)
        .findOneByOrFail({ slug: 'user' });
      const admin = await db
        .getRepository(Permission)
        .findOneByOrFail({ slug: 'admin' });
      for (const [name, id] of Object.entries(actors))
        await db.getRepository(User).insert({
          id,
          name,
          username: name,
          email: `${name}@example.test`,
          dtBirth: '1990-01-01',
          permissionId: name === 'admin' ? admin.id : user.id,
        });
      const arena = await db.getRepository(Arena).save({
        address: 'Test court',
        lat: '-15.768232',
        longitude: '-47.8797558',
        image: null,
        isLeagueOnly: false,
      });
      await db.getRepository(SportArena).insert([
        { arenaId: arena.id, sportId: '1' },
        { arenaId: arena.id, sportId: '2' },
      ]);
      const schedule = await db
        .getRepository(Schedule)
        .findOneByOrFail({ horary: '18:00:00' });
      return {
        arena,
        schedule,
        date: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
      };
    },
  };
}
