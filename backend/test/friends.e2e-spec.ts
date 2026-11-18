import { Friend } from '../src/database/entities/index.js';
import { directChatTopic } from '../src/modules/chat/domain/chat-topic.js';
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
    const topic = directChatTopic(actors.alice, actors.bob);
    expect(h.chatAccess.revokeParticipant).toHaveBeenCalledTimes(2);
    expect(h.chatAccess.revokeParticipant).toHaveBeenCalledWith(
      topic,
      actors.alice,
    );
    expect(h.chatAccess.revokeParticipant).toHaveBeenCalledWith(
      topic,
      actors.bob,
    );
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
  it('removes accepted friendships, revokes both chat participants and preserves blocks', async () => {
    const pending = await h
      .post('/friend')
      .send({ userId: actors.bob })
      .expect(200);
    await h
      .put('/friend', 'bob')
      .send({ friendId: pending.body.id, action: 'accept' })
      .expect(200);
    await h.delete(`/friend/${pending.body.id}`, 'carol').expect(403);
    await h.delete(`/friend/${pending.body.id}`, 'bob').expect(200);
    expect((await h.get('/friend')).body.friends.total).toBe(0);
    expect(h.chatAccess.revokeParticipant).toHaveBeenCalledTimes(4);
    const next = await h
      .post('/friend')
      .send({ userId: actors.bob })
      .expect(200);
    await h
      .put('/friend', 'bob')
      .send({ friendId: next.body.id, action: 'block' })
      .expect(200);
    await h.delete(`/friend/${next.body.id}`).expect(409);
    await h.post('/friend').send({ userId: actors.bob }).expect(409);
  });
});
