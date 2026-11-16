import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from 'jose';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module.js';
import { configureHttp } from '../src/bootstrap/configure-http.js';
import { loadConfiguration } from '../src/config/environment.js';
import { ACCESS_TOKEN_VERIFIER } from '../src/modules/auth/domain/access-token-verifier.port.js';
import { SupabaseTokenVerifier } from '../src/modules/auth/adapters/supabase/supabase-token-verifier.js';
import {
  Appointment,
  Team,
  User,
  UserAppointment,
  UserTeam,
} from '../src/database/entities/index.js';

const configuration = loadConfiguration();
const isTestDatabase = new URL(configuration.database.url).pathname.endsWith(
  '_test',
);
const project = 'https://project.supabase.co';
const alice = '11111111-1111-4111-8111-111111111111';
const bob = '22222222-2222-4222-8222-222222222222';
const keys = await generateKeyPair('ES256');
const jwk = await exportJWK(keys.publicKey);
jwk.kid = 'e2e-key';
const verifier = new SupabaseTokenVerifier(
  project,
  createLocalJWKSet({ keys: [jwk] }),
);
async function token(id = alice) {
  return new SignJWT({
    role: 'authenticated',
    email: `${id}@example.test`,
    user_metadata: { full_name: id === alice ? 'Alice' : 'Bob' },
  })
    .setProtectedHeader({ alg: 'ES256', kid: 'e2e-key' })
    .setSubject(id)
    .setIssuer(project + '/auth/v1')
    .setAudience('authenticated')
    .setIssuedAt()
    .setExpirationTime('5m')
    .sign(keys.privateKey);
}

// These tests truncate application data. Refuse to run against the development DB.
describe('Users HTTP and PostgreSQL integration', () => {
  let app: INestApplication;
  let db: DataSource;
  let aliceToken: string;
  let bobToken: string;
  beforeAll(async () => {
    if (!isTestDatabase)
      throw new Error(
        'User integration tests require a dedicated PostgreSQL database ending in _test.',
      );
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(ACCESS_TOKEN_VERIFIER)
      .useValue(verifier)
      .compile();
    app = module.createNestApplication();
    configureHttp(app, configuration);
    await app.init();
    db = app.get(DataSource);
    aliceToken = await token(alice);
    bobToken = await token(bob);
  });
  beforeEach(async () => {
    await db.query(
      'TRUNCATE public.users, public.team RESTART IDENTITY CASCADE',
    );
  });
  afterAll(async () => {
    await app?.close();
  });

  const client = () => request(app.getHttpServer());
  // Simulates profiles already created by the external auth.users trigger.
  async function seedProfile(bearer = aliceToken) {
    const id = bearer === bobToken ? bob : alice;
    await db.getRepository(User).upsert(
      {
        id,
        name: id === alice ? 'Alice' : 'Bob',
        email: `${id}@example.test`,
      },
      ['id'],
    );
  }
  async function adult(bearer = aliceToken) {
    await seedProfile(bearer);
    return client()
      .patch('/users/me')
      .auth(bearer, { type: 'bearer' })
      .send({ birthDate: '1990-01-01' })
      .expect(200);
  }

  it('keeps health public, deletes the root and protects users by default', async () => {
    await client().get('/').expect(404);
    const health = await client().get('/health').expect(200);
    expect(health.body).toMatchObject({ status: 'ok', database: 'up' });
    await client().get('/users/me').expect(401);
    await client()
      .get('/users/me')
      .auth('invalid', { type: 'bearer' })
      .expect(401);
    await client()
      .get('/users/me')
      .auth(bobToken, { type: 'bearer' })
      .expect(404);
  });
  it('reads externally provisioned profiles and has no creation route', async () => {
    await seedProfile();
    const result = await client()
      .get('/users/me')
      .auth(aliceToken, { type: 'bearer' })
      .expect(200);
    expect(result.body).toMatchObject({
      id: alice,
      name: 'Alice',
      birthDate: null,
      permission: null,
    });
    expect(result.body).not.toHaveProperty('permissionId');
    await client()
      .post('/users/me')
      .auth(aliceToken, { type: 'bearer' })
      .send({})
      .expect(404);
    expect(await db.getRepository(User).count()).toBe(1);
    await client()
      .get('/users/me')
      .auth(bobToken, { type: 'bearer' })
      .expect(404);
    expect(await db.getRepository(User).count()).toBe(1);
  });
  it('updates only the caller and prevents mass assignment, underage dates and malformed IDs', async () => {
    await seedProfile();
    await seedProfile(bobToken);
    await client()
      .patch('/users/me')
      .auth(aliceToken, { type: 'bearer' })
      .send({ username: 'alice', birthDate: '2000-01-01' })
      .expect(200);
    await client()
      .patch('/users/me')
      .auth(aliceToken, { type: 'bearer' })
      .send({})
      .expect(400);
    for (const body of [
      { id: bob },
      { permissionId: '2' },
      { email: 'other@example.test' },
      { birthDate: '2015-01-01' },
      { name: null },
      { birthDate: '2000-02-30' },
    ]) {
      await client()
        .patch('/users/me')
        .auth(aliceToken, { type: 'bearer' })
        .send(body)
        .expect(400);
    }
    await client()
      .patch('/users/me')
      .auth(bobToken, { type: 'bearer' })
      .send({ username: 'alice' })
      .expect(409);
    expect(
      (await db.getRepository(User).findOneByOrFail({ id: bob })).username,
    ).toBeNull();
    const response = await client()
      .get('/users')
      .query({ search: 'Alice' })
      .auth(bobToken, { type: 'bearer' })
      .expect(200);
    expect(response.body.items[0]).toEqual({
      id: alice,
      name: 'Alice',
      username: 'alice',
      image: null,
    });
    expect(response.body.items[0]).not.toHaveProperty('email');
    await client()
      .get('/users')
      .query({ search: 'a', limit: 500 })
      .auth(aliceToken, { type: 'bearer' })
      .expect(400);
  });
  it('persists a theme without accepting another user identity', async () => {
    await seedProfile();
    await client()
      .get('/users/me/theme')
      .auth(aliceToken, { type: 'bearer' })
      .expect(200, { theme: 'system' });
    await client()
      .put('/users/me/theme')
      .auth(aliceToken, { type: 'bearer' })
      .send({ theme: 'dark' })
      .expect(200, { theme: 'dark' });
    await client()
      .get('/users/me/theme')
      .auth(aliceToken, { type: 'bearer' })
      .expect(200, { theme: 'dark' });
    await client()
      .put('/users/me/theme')
      .auth(aliceToken, { type: 'bearer' })
      .send({ theme: 'unknown' })
      .expect(400);
    await client()
      .put('/users/me/theme')
      .auth(aliceToken, { type: 'bearer' })
      .send({ theme: 'light', userId: bob })
      .expect(400);
  });
  it('atomically replaces favorites and preserves them after validation failures', async () => {
    await seedProfile();
    await client()
      .put('/users/me/sports')
      .auth(aliceToken, { type: 'bearer' })
      .send({ sportIds: ['1', '2'] })
      .expect(200);
    for (const sportIds of [
      ['1', '1'],
      ['1', '2', '3', '4', '5'],
      ['9223372036854775808'],
    ]) {
      await client()
        .put('/users/me/sports')
        .auth(aliceToken, { type: 'bearer' })
        .send({ sportIds })
        .expect(400);
    }
    await client()
      .put('/users/me/sports')
      .auth(aliceToken, { type: 'bearer' })
      .send({ sportIds: ['999999'] })
      .expect(404);
    const response = await client()
      .get('/users/me/sports')
      .auth(aliceToken, { type: 'bearer' })
      .expect(200);
    expect(response.body.items.map((item: { id: string }) => item.id)).toEqual([
      '1',
      '2',
    ]);
    const results = await Promise.all(
      [
        ['1', '2', '3', '4'],
        ['5', '6', '7', '8'],
      ].map((sportIds) =>
        client()
          .put('/users/me/sports')
          .auth(aliceToken, { type: 'bearer' })
          .send({ sportIds }),
      ),
    );
    expect(results.map((result) => result.status)).toEqual([200, 200]);
    const final = await client()
      .get('/users/me/sports')
      .auth(aliceToken, { type: 'bearer' })
      .expect(200);
    expect(final.body.items).toHaveLength(4);
    await client()
      .put('/users/me/sports')
      .auth(aliceToken, { type: 'bearer' })
      .send({ sportIds: [] })
      .expect(200, { items: [], maxFavorites: 4, remainingSlots: 4 });
  });
  it('lists only the authenticated user team memberships', async () => {
    await seedProfile();
    await seedProfile(bobToken);
    const first = await db.getRepository(Team).save({ name: 'Alice team' });
    const second = await db.getRepository(Team).save({ name: 'Bob team' });
    await db.getRepository(UserTeam).insert([
      { userId: alice, teamId: first.id, role: 'member' },
      { userId: bob, teamId: second.id, role: 'captain' },
    ]);
    const result = await client()
      .get('/users/me/teams')
      .auth(aliceToken, { type: 'bearer' })
      .expect(200);
    expect(result.body.items).toEqual([
      {
        id: first.id,
        name: first.name,
        role: 'member',
        description: null,
        image: null,
        joinedAt: null,
      },
    ]);
    await client()
      .post('/users/team')
      .auth(aliceToken, { type: 'bearer' })
      .send({ teamId: second.id })
      .expect(404);
  });
  it('serializes concurrent appointment admission so capacity cannot be exceeded', async () => {
    await adult();
    await adult(bobToken);
    const appointment = await db.getRepository(Appointment).save({
      organizerId: bob,
      title: 'One place',
      scheduledAt: new Date(Date.now() + 86400000),
      maxPlayers: 1,
    });
    const results = await Promise.all(
      [aliceToken, bobToken].map((bearer) =>
        client()
          .post(`/users/me/appointments/${appointment.id}`)
          .auth(bearer, { type: 'bearer' })
          .send({}),
      ),
    );
    expect(
      results
        .map((result) => result.status)
        .sort((left, right) => left - right),
    ).toEqual([201, 409]);
    expect(
      await db
        .getRepository(UserAppointment)
        .countBy({ appointmentId: appointment.id }),
    ).toBe(1);
    const winner = results[0].status === 201 ? aliceToken : bobToken;
    await client()
      .post(`/users/me/appointments/${appointment.id}`)
      .auth(winner, { type: 'bearer' })
      .send({})
      .expect(409);
    const page = await client()
      .get('/users/me/appointments')
      .auth(winner, { type: 'bearer' })
      .expect(200);
    expect(page.body.items).toHaveLength(1);
    expect(page.body.items[0].scheduledAt).toBe(
      appointment.scheduledAt.toISOString(),
    );
  });
  it('rejects closed appointments and incomplete profiles', async () => {
    await seedProfile();
    const appointment = await db.getRepository(Appointment).save({
      organizerId: alice,
      title: 'Closed',
      scheduledAt: new Date(Date.now() + 86400000),
      status: 'canceled',
    });
    await client()
      .post(`/users/me/appointments/${appointment.id}`)
      .auth(aliceToken, { type: 'bearer' })
      .send({})
      .expect(400);
    await adult();
    await client()
      .post(`/users/me/appointments/${appointment.id}`)
      .auth(aliceToken, { type: 'bearer' })
      .send({})
      .expect(409);
    await client()
      .post('/users/me/appointments/9223372036854775808')
      .auth(aliceToken, { type: 'bearer' })
      .send({})
      .expect(400);
  });
  it('filters and sorts directory cards with useful page metadata and literal search escaping', async () => {
    await seedProfile();
    await seedProfile(bobToken);
    await db
      .getRepository(User)
      .update(alice, { name: 'Zebra Alice', username: 'player' });
    await db
      .getRepository(User)
      .update(bob, { name: 'Alpha', username: 'alicefriend' });
    const first = await client()
      .get('/users')
      .query({ search: 'Alice', sortBy: 'name', limit: 1 })
      .auth(aliceToken, { type: 'bearer' })
      .expect(200);
    expect(first.body).toMatchObject({
      total: 2,
      totalPages: 2,
      hasNextPage: true,
      hasPreviousPage: false,
    });
    expect(first.body.items[0].id).toBe(bob);
    expect(first.body.items[0]).not.toHaveProperty('email');
    const second = await client()
      .get('/users')
      .query({ search: 'Alice', sortBy: 'name', limit: 1, page: 2 })
      .auth(aliceToken, { type: 'bearer' })
      .expect(200);
    expect(second.body).toMatchObject({
      totalPages: 2,
      hasNextPage: false,
      hasPreviousPage: true,
    });
    expect(second.body.items[0].id).toBe(alice);
    const byName = await client()
      .get('/users')
      .query({ search: 'Alice', searchBy: 'name' })
      .auth(aliceToken, { type: 'bearer' })
      .expect(200);
    expect(byName.body.items.map((item: { id: string }) => item.id)).toEqual([
      alice,
    ]);
    const byUsername = await client()
      .get('/users')
      .query({ search: 'Alice', searchBy: 'username' })
      .auth(aliceToken, { type: 'bearer' })
      .expect(200);
    expect(
      byUsername.body.items.map((item: { id: string }) => item.id),
    ).toEqual([bob]);
    const literal = await client()
      .get('/users')
      .query({ search: '%%' })
      .auth(aliceToken, { type: 'bearer' })
      .expect(200);
    expect(literal.body.total).toBe(0);
    await client()
      .get('/users')
      .query({ search: 'Alice', sortBy: 'id; DROP TABLE users' })
      .auth(aliceToken, { type: 'bearer' })
      .expect(400);
    await client()
      .get('/users')
      .query({ search: 'Alice', searchBy: 'email' })
      .auth(aliceToken, { type: 'bearer' })
      .expect(400);
  });
  it('filters team memberships while returning the details needed for team cards', async () => {
    await seedProfile();
    await seedProfile(bobToken);
    const first = await db
      .getRepository(Team)
      .save({
        name: 'Alpha',
        description: 'Public team description',
        image: 'https://example.test/team.png',
      });
    const second = await db.getRepository(Team).save({ name: 'Beta' });
    const hidden = await db
      .getRepository(Team)
      .save({ name: 'Private Bob team' });
    const joinedAt = new Date('2026-01-01T12:00:00Z');
    await db.getRepository(UserTeam).insert([
      { userId: alice, teamId: first.id, role: 'captain', createdAt: joinedAt },
      { userId: alice, teamId: second.id, role: 'member' },
      { userId: bob, teamId: hidden.id, role: 'captain' },
    ]);
    const response = await client()
      .get('/users/me/teams')
      .query({ role: 'captain', search: 'Alpha' })
      .auth(aliceToken, { type: 'bearer' })
      .expect(200);
    expect(response.body).toMatchObject({ total: 1, totalPages: 1 });
    expect(response.body.items[0]).toEqual({
      id: first.id,
      name: 'Alpha',
      role: 'captain',
      description: 'Public team description',
      image: 'https://example.test/team.png',
      joinedAt: joinedAt.toISOString(),
    });
    const sorted = await client()
      .get('/users/me/teams')
      .query({ sortBy: 'name', limit: 1 })
      .auth(aliceToken, { type: 'bearer' })
      .expect(200);
    expect(sorted.body.total).toBe(2);
    expect(sorted.body.items[0].id).toBe(first.id);
    expect(sorted.body.hasNextPage).toBe(true);
    await client()
      .get('/users/me/teams')
      .query({ role: 'admin' })
      .auth(aliceToken, { type: 'bearer' })
      .expect(400);
    await client()
      .get('/users/me/teams')
      .query({ userId: bob })
      .auth(aliceToken, { type: 'bearer' })
      .expect(400);
  });
  it('filters appointments by period, status and explicit false holder without exposing deleted records', async () => {
    await adult();
    await adult(bobToken);
    const firstDate = new Date(Date.now() + 86400000);
    const lastDate = new Date(Date.now() + 172800000);
    const reserve = await db
      .getRepository(Appointment)
      .save({
        organizerId: alice,
        title: 'Reserve match',
        description: 'Bring water',
        scheduledAt: firstDate,
        maxPlayers: 4,
      });
    const starter = await db
      .getRepository(Appointment)
      .save({
        organizerId: bob,
        title: 'Starter match',
        scheduledAt: lastDate,
        maxPlayers: 6,
      });
    const finished = await db
      .getRepository(Appointment)
      .save({
        organizerId: bob,
        title: 'Finished match',
        scheduledAt: new Date(Date.now() - 86400000),
        status: 'finished',
      });
    const deleted = await db
      .getRepository(Appointment)
      .save({
        organizerId: bob,
        title: 'Deleted match',
        scheduledAt: lastDate,
        deletedAt: new Date(),
      });
    await db.getRepository(UserAppointment).insert([
      { userId: alice, appointmentId: reserve.id, holder: false },
      { userId: alice, appointmentId: starter.id, holder: true },
      { userId: alice, appointmentId: finished.id, holder: true },
      { userId: alice, appointmentId: deleted.id, holder: true },
    ]);
    const response = await client()
      .get('/users/me/appointments')
      .query({
        status: 'scheduled',
        holder: 'false',
        from: new Date(firstDate.getTime() - 1000).toISOString(),
        to: new Date(lastDate.getTime() + 1000).toISOString(),
      })
      .auth(aliceToken, { type: 'bearer' })
      .expect(200);
    expect(response.body.total).toBe(1);
    expect(response.body.items[0]).toMatchObject({
      id: reserve.id,
      holder: false,
      description: 'Bring water',
      maxPlayers: 4,
      organizerId: alice,
      isOrganizer: true,
    });
    const all = await client()
      .get('/users/me/appointments')
      .query({ sortOrder: 'asc' })
      .auth(aliceToken, { type: 'bearer' })
      .expect(200);
    expect(all.body.total).toBe(3);
    expect(all.body.items.map((item: { id: string }) => item.id)).toEqual([
      finished.id,
      reserve.id,
      starter.id,
    ]);
    expect(all.body.items[2].isOrganizer).toBe(false);
    await client()
      .get('/users/me/appointments')
      .query({ holder: 'yes' })
      .auth(aliceToken, { type: 'bearer' })
      .expect(400);
    await client()
      .get('/users/me/appointments')
      .query({ from: lastDate.toISOString(), to: firstDate.toISOString() })
      .auth(aliceToken, { type: 'bearer' })
      .expect(400);
    await client()
      .get('/users/me/appointments')
      .query({ from: '2026-01-01' })
      .auth(aliceToken, { type: 'bearer' })
      .expect(400);
  });
  it('normalizes profile edits and exposes favorite capacity from a single policy', async () => {
    await seedProfile();
    const profile = await client()
      .patch('/users/me')
      .auth(aliceToken, { type: 'bearer' })
      .send({ name: ' Alice Smith ', username: ' alice_smith ' })
      .expect(200);
    expect(profile.body).toMatchObject({
      name: 'Alice Smith',
      username: 'alice_smith',
    });
    const sports = await client()
      .put('/users/me/sports')
      .auth(aliceToken, { type: 'bearer' })
      .send({ sportIds: ['1', '2'] })
      .expect(200);
    expect(sports.body).toMatchObject({ maxFavorites: 4, remainingSlots: 2 });
    await client()
      .patch('/users/me')
      .auth(aliceToken, { type: 'bearer' })
      .send({ image: 'http://example.test/a' })
      .expect(400);
  });
  it('serves Bearer security and DTO contracts through OpenAPI and handles browser preflight', async () => {
    const response = await client().get('/api-json').expect(200);
    expect(response.body.paths['/users/me'].post).toBeUndefined();
    expect(response.body.paths['/users/me'].get.security).toEqual([
      { bearer: [] },
    ]);
    expect(response.body.paths['/health'].get.security).toBeUndefined();
    expect(response.body.components.schemas.UserProfileDto).toBeDefined();
    await client()
      .options('/users/me')
      .set('Origin', 'http://localhost:4200')
      .set('Access-Control-Request-Method', 'PATCH')
      .set('Access-Control-Request-Headers', 'authorization,content-type')
      .expect(204)
      .expect('Access-Control-Allow-Origin', 'http://localhost:4200');
  });
});
