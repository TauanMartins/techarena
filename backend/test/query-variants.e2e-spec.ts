import { actors, workflowHarness } from './support/workflow-harness.js';
import { User, UserTeam } from '../src/database/entities/index.js';

describe('SQL filter, ordering and pagination variants', () => {
  let h: Awaited<ReturnType<typeof workflowHarness>>;
  beforeAll(async () => {
    h = await workflowHarness();
  });
  afterAll(async () => {
    await h?.app.close();
  });

  it('executes appointment subqueries and computed ordering with joins on every page', async () => {
    const { arena, schedule, date } = await h.reset();
    const ids: string[] = [];
    for (const [offset, sportId] of ['1', '2', '1'].entries()) {
      const nextDate = new Date(
        Date.parse(date + 'T00:00:00Z') + offset * 86400000,
      )
        .toISOString()
        .slice(0, 10);
      const booking = await h
        .post('/appointments')
        .send({
          arenaId: arena.id,
          scheduleId: schedule.id,
          sportId,
          date: nextDate,
        })
        .expect(201);
      ids.push(booking.body.id);
    }
    await h
      .put('/users/me/sports')
      .send({ sportIds: ['2'] })
      .expect(200);
    for (const path of ['/appointments', '/appointments/user']) {
      for (const preferSports of ['false', 'true']) {
        for (const distance of ['near', 'far']) {
          for (const orderByTime of ['recent', 'future']) {
            const query = {
              preferSports,
              distance,
              orderByTime,
              lat: arena.lat,
              longitude: arena.longitude,
              radiusKm: 1,
              limit: 1,
            };
            const pages: string[] = [];
            for (const page of [1, 2, 3, 4]) {
              const result = await h
                .get(path)
                .query({ ...query, page })
                .expect(200);
              expect(result.body.total).toBe(3);
              pages.push(
                ...result.body.items.map((item: { id: string }) => item.id),
              );
              for (const item of result.body.items)
                expect(item).toMatchObject({
                  players: 1,
                  startingPlayers: 1,
                  isInside: true,
                });
            }
            expect(new Set(pages)).toEqual(new Set(ids));
            if (preferSports === 'true') expect(pages[0]).toBe(ids[1]);
            else
              expect(pages).toEqual(
                orderByTime === 'recent' ? ids : [...ids].reverse(),
              );
          }
        }
      }
      const filter = await h
        .get(path)
        .query({ sportId: '2', arenaId: arena.id, limit: 1 })
        .expect(200);
      expect(filter.body.items.map((item: { id: string }) => item.id)).toEqual([
        ids[1],
      ]);
      const distant = await h
        .get(path)
        .query({ lat: 0, longitude: 0, radiusKm: 1 })
        .expect(200);
      expect(distant.body.total).toBe(0);
    }
  });

  it('executes literal catalog search, relationship pagination and member sorting variants', async () => {
    const { arena } = await h.reset();
    for (const [name, id] of Object.entries(actors)) {
      await h.db
        .getRepository(User)
        .update(id, { name: `Audit ${name}`, username: `audit_${name}` });
    }
    for (const searchBy of ['all', 'name', 'username']) {
      for (const sortBy of ['name', 'username']) {
        for (const sortOrder of ['asc', 'desc']) {
          const seen: string[] = [];
          for (const page of [1, 2, 3, 4, 5]) {
            const result = await h
              .get('/users')
              .query({
                search: 'Audit',
                searchBy,
                sortBy,
                sortOrder,
                page,
                limit: 1,
              })
              .expect(200);
            expect(result.body.total).toBe(4);
            seen.push(
              ...result.body.items.map((item: { id: string }) => item.id),
            );
          }
          expect(new Set(seen)).toEqual(new Set(Object.values(actors)));
        }
      }
    }

    const first = await h.post('/team').send({ name: 'Alpha_%' }).expect(201);
    const second = await h.post('/team').send({ name: 'Beta' }).expect(201);
    await h.db
      .getRepository(UserTeam)
      .insert({ userId: actors.bob, teamId: first.body.id, role: 'member' });
    for (const sortBy of ['name', 'joinedAt']) {
      for (const sortOrder of ['asc', 'desc']) {
        const seen: string[] = [];
        for (const page of [1, 2, 3]) {
          const result = await h
            .get('/users/me/teams')
            .query({ sortBy, sortOrder, page, limit: 1 })
            .expect(200);
          expect(result.body.total).toBe(2);
          seen.push(
            ...result.body.items.map((item: { id: string }) => item.id),
          );
        }
        expect(new Set(seen)).toEqual(new Set([first.body.id, second.body.id]));
      }
    }
    for (const path of ['/team', '/arenas', '/sports']) {
      await h.get(path).query({ search: '_%', page: 1, limit: 1 }).expect(200);
      await h.get(path).query({ search: '_%', page: 2, limit: 1 }).expect(200);
    }
    const literal = await h.get('/team').query({ search: '_%' }).expect(200);
    expect(literal.body.total).toBe(1);
    for (const page of [1, 2, 3]) {
      await h
        .get('/sports/arena')
        .query({ arenaId: arena.id, page, limit: 1 })
        .expect(200);
      await h
        .get('/sports/material')
        .query({ sportId: '1', page, limit: 1 })
        .expect(200);
      for (const path of [
        '/arenas',
        '/arenas/users',
        '/arenas/sports',
        '/arenas/admin',
      ]) {
        await h
          .get(path, 'admin')
          .query({
            sportId: '1',
            lat: arena.lat,
            longitude: arena.longitude,
            radiusKm: 1,
            page,
            limit: 1,
          })
          .expect(200);
      }
    }
    await h
      .post('/team/user')
      .send({ teamId: first.body.id, userId: actors.carol })
      .expect(201);
    for (const page of [1, 2]) {
      await h
        .get('/team/user')
        .query({ teamId: first.body.id, page, limit: 1 })
        .expect(200);
      await h
        .get('/users/me/team-requests', 'carol')
        .query({ page, limit: 1 })
        .expect(200);
    }
    await h.post('/friend').send({ userId: actors.bob }).expect(200);
    const accepted = await h
      .post('/friend')
      .send({ userId: actors.carol })
      .expect(200);
    await h
      .put('/friend', 'carol')
      .send({ friendId: accepted.body.id, action: 'accept' })
      .expect(200);
    await h.post('/friend', 'admin').send({ userId: actors.alice }).expect(200);
    for (const page of [1, 2]) {
      const result = await h
        .get('/friend')
        .query({ page, limit: 1 })
        .expect(200);
      expect(result.body.friends.total).toBe(1);
      expect(result.body.requestedFriends.total).toBe(1);
      expect(result.body.receivedFriends.total).toBe(1);
    }
  });
});
