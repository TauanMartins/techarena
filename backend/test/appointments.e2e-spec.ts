import {
  Appointment,
  UserAppointment,
} from '../src/database/entities/index.js';
import { actors, workflowHarness } from './support/workflow-harness.js';

describe('appointments migration workflows', () => {
  let h: Awaited<ReturnType<typeof workflowHarness>>;
  let fixture: Awaited<
    ReturnType<Awaited<ReturnType<typeof workflowHarness>>['reset']>
  >;
  beforeAll(async () => {
    h = await workflowHarness();
  });
  beforeEach(async () => {
    fixture = await h.reset();
  });
  afterAll(async () => {
    await h?.app.close();
  });
  const booking = () => ({
    arenaId: fixture.arena.id,
    sportId: '1',
    scheduleId: fixture.schedule.id,
    date: fixture.date,
  });

  it('reserves arena slots and excludes the slot across every supported sport', async () => {
    const slots = await h
      .get('/horary')
      .query({ arenaId: fixture.arena.id, sportId: '1', date: fixture.date })
      .expect(200);
    expect(
      slots.body.items.some(
        (s: { id: string }) => s.id === fixture.schedule.id,
      ),
    ).toBe(true);
    const result = await h.post('/appointments').send(booking()).expect(201);
    expect(result.body).toMatchObject({
      organizerId: actors.alice,
      arenaId: fixture.arena.id,
      sportId: '1',
      players: 1,
      startingPlayers: 1,
      isInside: true,
    });
    const blocked = await h
      .get('/horary')
      .query({ arenaId: fixture.arena.id, sportId: '2', date: fixture.date })
      .expect(200);
    expect(
      blocked.body.items.some(
        (s: { id: string }) => s.id === fixture.schedule.id,
      ),
    ).toBe(false);
    await h
      .post('/appointments', 'bob')
      .send({ ...booking(), sportId: '2' })
      .expect(409);
    expect(await h.db.getRepository(Appointment).count()).toBe(1);
    const discovery = await h
      .get('/appointments')
      .query({ lat: fixture.arena.lat, longitude: fixture.arena.longitude })
      .expect(200);
    expect(discovery.body.items[0].distanceKm).toBeLessThan(0.001);
    expect(discovery.body.items[0].isInside).toBe(true);
    const mine = await h.get('/appointments/user').expect(200);
    expect(mine.body.total).toBe(1);
    expect((await h.get('/appointments/user', 'bob')).body.total).toBe(0);
  });
  it('allows one concurrent reservation and rolls back the losing organizer membership', async () => {
    const results = await Promise.all([
      h.post('/appointments').send(booking()),
      h.post('/appointments', 'bob').send({ ...booking(), sportId: '2' }),
    ]);
    expect(results.map((r) => r.status).sort((a, b) => a - b)).toEqual([
      201, 409,
    ]);
    expect(await h.db.getRepository(Appointment).count()).toBe(1);
    expect(await h.db.getRepository(UserAppointment).count()).toBe(1);
  });
  it('rejects invalid bookings and preserves booking history when editing arena sports', async () => {
    await h
      .post('/appointments')
      .send({ ...booking(), username: 'bob' })
      .expect(400);
    await h
      .post('/appointments')
      .send({ ...booking(), date: '2026-02-30' })
      .expect(400);
    await h
      .post('/appointments')
      .send({ ...booking(), date: '2000-01-01' })
      .expect(409);
    await h
      .post('/appointments')
      .send({ ...booking(), sportId: '3' })
      .expect(404);
    await h.post('/appointments').send(booking()).expect(201);
    await h
      .put('/arenas', 'admin')
      .send({
        arenaId: fixture.arena.id,
        address: 'Changed',
        lat: 0,
        longitude: 0,
        isLeagueOnly: false,
        sportIds: ['2'],
      })
      .expect(409);
    const arena = (await h.get('/arenas')).body.items[0];
    expect(arena.address).toBe('Test court');
    expect(arena.sportIds).toContain('1');
  });
  it('frees canceled slots and keeps legacy appointments without fabricated booking links', async () => {
    const result = await h.post('/appointments').send(booking()).expect(201);
    await h.db
      .getRepository(Appointment)
      .update(result.body.id, { status: 'canceled' });
    const available = await h
      .get('/horary')
      .query({ arenaId: fixture.arena.id, sportId: '1', date: fixture.date })
      .expect(200);
    expect(
      available.body.items.some(
        (s: { id: string }) => s.id === fixture.schedule.id,
      ),
    ).toBe(true);
    await h.post('/appointments', 'bob').send(booking()).expect(201);
    await h.db.getRepository(Appointment).save({
      organizerId: actors.alice,
      title: 'Legacy',
      scheduledAt: new Date(Date.now() + 86400000),
    });
    const all = await h.get('/appointments').expect(200);
    expect(all.body.total).toBe(2);
    expect(
      all.body.items.find((a: { title: string }) => a.title === 'Legacy'),
    ).toMatchObject({ arenaId: null, sportId: null, scheduleId: null });
  });
  it('prioritizes preferred sports and reflects participation in discovery cards', async () => {
    const first = await h
      .post('/appointments', 'bob')
      .send(booking())
      .expect(201);
    const secondDate = new Date(
      Date.parse(fixture.date + 'T00:00:00Z') + 86400000,
    )
      .toISOString()
      .slice(0, 10);
    const second = await h
      .post('/appointments', 'bob')
      .send({ ...booking(), date: secondDate, sportId: '2' })
      .expect(201);
    await h
      .put('/users/me/sports')
      .send({ sportIds: ['2'] })
      .expect(200);
    const preferred = await h
      .get('/appointments')
      .query({
        preferSports: 'true',
        lat: fixture.arena.lat,
        longitude: fixture.arena.longitude,
      })
      .expect(200);
    expect(preferred.body.items[0].id).toBe(second.body.id);
    const chronological = await h
      .get('/appointments')
      .query({ preferSports: 'false' })
      .expect(200);
    expect(chronological.body.items[0].id).toBe(first.body.id);
    await h
      .post('/users/me/appointments/' + first.body.id)
      .send({})
      .expect(201);
    const mine = await h.get('/appointments/user').expect(200);
    expect(mine.body.total).toBe(1);
    expect(mine.body.items[0].isInside).toBe(true);
  });
});
