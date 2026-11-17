import { workflowHarness } from './support/workflow-harness.js';

describe('catalogs migration workflows', () => {
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

  it('protects migrated routes and exposes sports, arena sports and materials', async () => {
    await h.raw().get('/sports').expect(401);
    const sports = await h.get('/sports').expect(200);
    expect(sports.body.total).toBe(12);
    const supported = await h
      .get('/sports/arena')
      .query({ arenaId: fixture.arena.id })
      .expect(200);
    expect(supported.body.items.map((s: { id: string }) => s.id)).toEqual([
      '1',
      '2',
    ]);
    const materials = await h
      .get('/sports/material')
      .query({ sportId: '1' })
      .expect(200);
    expect(materials.body.items.length).toBeGreaterThan(0);
    expect(typeof materials.body.items[0].relatedToLocal).toBe('boolean');
    await h.get('/sports/arena').query({ arenaId: '99999' }).expect(404);
    await h.get('/sports/material').query({ sportId: '0' }).expect(400);
  });
  it('lists player-provided materials, excluding equipment belonging to the venue', async () => {
    const expected = await h.db.query<{ id: string }[]>(
      'SELECT material_id AS id FROM sport_material WHERE sport_id = $1 AND related_to_local = false ORDER BY id',
      ['1'],
    );
    const local = await h.db.query<{ id: string }[]>(
      'SELECT material_id AS id FROM sport_material WHERE sport_id = $1 AND related_to_local = true',
      ['1'],
    );
    expect(expected.length).toBeGreaterThan(0);
    expect(local.length).toBeGreaterThan(0);
    const response = await h
      .get('/sports/material')
      .query({ sportId: '1', limit: 50 })
      .expect(200);
    expect(response.body.total).toBe(expected.length);
    expect(response.body.items.map((item: { id: string }) => item.id)).toEqual(
      expected.map((item) => item.id),
    );
    expect(
      response.body.items.every(
        (item: { relatedToLocal: boolean }) => !item.relatedToLocal,
      ),
    ).toBe(true);
  });
  it('filters arenas and computes distance with bound coordinates', async () => {
    await h.get('/arenas').expect(200);
    const selected = await h
      .get('/arenas')
      .query({ arenaId: fixture.arena.id })
      .expect(200);
    expect(
      selected.body.items.map((arena: { id: string }) => arena.id),
    ).toEqual([fixture.arena.id]);
    expect(
      (await h.get('/arenas').query({ arenaId: '99999' }).expect(200)).body
        .total,
    ).toBe(0);
    await h.get('/arenas').query({ arenaId: 'invalid' }).expect(400);
    const filtered = await h
      .get('/arenas/sports')
      .query({ sportId: '1' })
      .expect(200);
    expect(filtered.body.total).toBe(1);
    const nearby = await h
      .get('/arenas/users')
      .query({
        lat: fixture.arena.lat,
        longitude: fixture.arena.longitude,
        radiusKm: 1,
      })
      .expect(200);
    expect(nearby.body.items[0].distanceKm).toBeLessThan(0.001);
    await h
      .get('/arenas/users')
      .query({ lat: '0); DROP TABLE arena;--', longitude: 0 })
      .expect(400);
    await h.get('/arenas/users').query({ lat: 0 }).expect(400);
    await h.get('/arenas/admin').expect(403);
    await h.get('/arenas/admin', 'admin').expect(200);
  });
  it('limits arena writes to administrators and changes sports transactionally', async () => {
    const body = {
      address: 'Second court',
      lat: 0,
      longitude: 0,
      sportIds: ['1'],
      isLeagueOnly: false,
      image: null,
    };
    await h.post('/arenas').send(body).expect(403);
    await h
      .post('/arenas', 'admin')
      .send({ ...body, sportIds: ['99999'] })
      .expect(404);
    expect((await h.get('/arenas/admin', 'admin')).body.total).toBe(1);
    const created = await h.post('/arenas', 'admin').send(body).expect(201);
    await h
      .put('/arenas', 'bob')
      .send({ ...body, arenaId: created.body.id })
      .expect(403);
    const updated = await h
      .put('/arenas', 'admin')
      .send({ ...body, arenaId: created.body.id, sportIds: ['2'] })
      .expect(200);
    expect(updated.body.sportIds).toEqual(['2']);
    await h
      .post('/arenas', 'admin')
      .send({ ...body, address: 'League court', isLeagueOnly: true })
      .expect(201);
    expect((await h.get('/arenas')).body.total).toBe(2);
    expect((await h.get('/arenas/admin', 'admin')).body.total).toBe(3);
  });
});
