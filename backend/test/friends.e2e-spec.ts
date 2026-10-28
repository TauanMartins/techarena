import { Friend } from '../src/database/entities/index.js';
import { actors, workflowHarness } from './support/workflow-harness.js';

describe('friends migration workflows', () => {
  let h: Awaited<ReturnType<typeof workflowHarness>>;
  beforeAll(async () => {
    h = await workflowHarness();
  });
  beforeEach(async () => {
    await h.reset();
  });
  afterAll(async () => {
    await h?.app.close();
  });

  it('requires friend acceptance by the recipient and keeps private profile fields out of responses', async () => {
    await h.post('/friend').send({ userId: actors.alice }).expect(400);
    const pending = await h
      .post('/friend')
      .send({ userId: actors.bob })
      .expect(200);
    expect(pending.body.user).not.toHaveProperty('email');
    await h.post('/friend', 'bob').send({ userId: actors.alice }).expect(409);
    await h.put('/friend').send({ friendId: pending.body.id }).expect(403);
    await h
      .put('/friend', 'carol')
      .send({ friendId: pending.body.id })
      .expect(403);
    expect((await h.get('/friend', 'bob')).body.receivedFriends.total).toBe(1);
    await h
      .put('/friend', 'bob')
      .send({ friendId: pending.body.id })
      .expect(200);
    expect((await h.get('/friend')).body.friends.items[0].user.id).toBe(
      actors.bob,
    );
    await h
      .put('/friend', 'bob')
      .send({ friendId: pending.body.id, action: 'block' })
      .expect(200);
    expect((await h.get('/friend')).body.friends.total).toBe(0);
    await h.post('/friend').send({ userId: actors.bob }).expect(409);
  });
  it('prevents reversed duplicate friendships under concurrency', async () => {
    const responses = await Promise.all([
      h.post('/friend').send({ userId: actors.bob }),
      h.post('/friend', 'bob').send({ userId: actors.alice }),
    ]);
    expect(responses.map((r) => r.status).sort((a, b) => a - b)).toEqual([
      200, 409,
    ]);
    expect(await h.db.getRepository(Friend).count()).toBe(1);
  });
});
