import {
  TeamMembershipRequest,
  UserTeam,
  User,
} from '../src/database/entities/index.js';
import { actors, workflowHarness } from './support/workflow-harness.js';

describe('teams migration workflows', () => {
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
  async function team() {
    return (
      await h
        .post('/team')
        .send({ name: 'Test team', description: 'Team description' })
        .expect(201)
    ).body;
  }

  it('creates captain membership and only lets the captain edit the team', async () => {
    const created = await team();
    const members = await h
      .get('/team/members')
      .query({ teamId: created.id })
      .expect(200);
    expect(members.body).toMatchObject({
      total: 1,
      items: [{ id: actors.alice, role: 'captain' }],
    });
    expect(
      await h.db.getRepository(UserTeam).existsBy({
        teamId: created.id,
        userId: actors.alice,
        role: 'captain',
      }),
    ).toBe(true);
    const exists = await h
      .get('/team/exist')
      .query({ name: ' TEST TEAM ' })
      .expect(200);
    expect(exists.body.exists).toBe(true);
    await h.post('/team', 'bob').send({ name: 'test TEAM' }).expect(409);
    await h
      .put('/team', 'bob')
      .send({ teamId: created.id, name: 'Hijacked' })
      .expect(403);
    const updated = await h
      .put('/team')
      .send({ teamId: created.id, name: 'New name' })
      .expect(200);
    expect(updated.body.name).toBe('New name');
    const listed = await h.get('/team').query({ search: 'New' }).expect(200);
    expect(listed.body.total).toBe(1);
  });
  it('requires invitation acceptance by the recipient before granting membership', async () => {
    const created = await team();
    await h
      .post('/team/user', 'bob')
      .send({ teamId: created.id, userId: actors.carol })
      .expect(403);
    const invite = await h
      .post('/team/user')
      .send({ teamId: created.id, userId: actors.bob })
      .expect(201);
    expect(invite.body).toMatchObject({
      kind: 'invitation',
      status: 'pending',
    });
    expect(
      await h.db
        .getRepository(UserTeam)
        .existsBy({ teamId: created.id, userId: actors.bob }),
    ).toBe(false);
    await h
      .put('/team/user')
      .send({ teamId: created.id, userId: actors.bob })
      .expect(409);
    await h
      .put(`/users/me/team-invitations/${invite.body.id}`, 'carol')
      .send({ action: 'accept' })
      .expect(403);
    const requests = await h.get('/users/me/team-requests', 'bob').expect(200);
    expect(requests.body.items[0].teamName).toBe('Test team');
    const results = await Promise.all([
      h
        .put(`/users/me/team-invitations/${invite.body.id}`, 'bob')
        .send({ action: 'accept' }),
      h
        .put(`/users/me/team-invitations/${invite.body.id}`, 'bob')
        .send({ action: 'accept' }),
    ]);
    expect(results.map((r) => r.status).sort((a, b) => a - b)).toEqual([
      200, 409,
    ]);
    expect(
      await h.db
        .getRepository(UserTeam)
        .countBy({ teamId: created.id, userId: actors.bob }),
    ).toBe(1);
    await h.get('/team/user', 'bob').query({ teamId: created.id }).expect(403);
  });
  it('supports member requests and captain decisions without granting captain privileges', async () => {
    const created = await team();
    const pending = await h
      .post('/users/me/team-requests', 'bob')
      .send({ teamId: created.id })
      .expect(201);
    expect(pending.body.kind).toBe('request');
    await h
      .post('/users/me/team-requests', 'bob')
      .send({ teamId: created.id })
      .expect(409);
    const requests = await h
      .get('/team/user')
      .query({ teamId: created.id })
      .expect(200);
    expect(requests.body.items).toHaveLength(1);
    await h
      .put('/team/user', 'carol')
      .send({ teamId: created.id, userId: actors.bob })
      .expect(403);
    await h
      .put('/team/user')
      .send({ teamId: created.id, userId: actors.bob })
      .expect(200);
    const members = await h
      .get('/team/members', 'bob')
      .query({ teamId: created.id })
      .expect(200);
    expect(
      members.body.items.map((member: { id: string }) => member.id),
    ).toEqual(expect.arrayContaining([actors.alice, actors.bob]));
    expect(members.body.total).toBe(2);
    expect(
      (
        await h.db
          .getRepository(UserTeam)
          .findOneByOrFail({ teamId: created.id, userId: actors.bob })
      ).role,
    ).toBe('member');
    await h
      .post('/team/user')
      .send({ teamId: created.id, userId: actors.bob })
      .expect(409);
  });
  it('supports declining invitations without creating membership and permits a new invitation', async () => {
    const created = await team();
    const invitation = await h
      .post('/team/user')
      .send({ teamId: created.id, userId: actors.bob })
      .expect(201);
    await h.db.getRepository(User).update(actors.bob, { dtBirth: null });
    await h
      .put(`/users/me/team-invitations/${invitation.body.id}`, 'bob')
      .send({ action: 'decline' })
      .expect(200);
    expect(
      await h.db
        .getRepository(UserTeam)
        .existsBy({ teamId: created.id, userId: actors.bob }),
    ).toBe(false);
    await h
      .post('/team/user')
      .send({ teamId: created.id, userId: actors.bob })
      .expect(201);
    expect(await h.db.getRepository(TeamMembershipRequest).count()).toBe(2);
  });
  it('lets members leave, captains remove members and only captains delete unlinked teams', async () => {
    const created = await team();
    await h.db.getRepository(UserTeam).insert({
      teamId: created.id,
      userId: actors.bob,
      role: 'member',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await h
      .delete(`/team/${created.id}/members/${actors.bob}`, 'carol')
      .expect(403);
    await h.delete(`/team/${created.id}/members/me`).expect(409);
    await h.delete(`/team/${created.id}`, 'bob').expect(403);
    await h.delete(`/team/${created.id}/members/me`, 'bob').expect(200);
    expect(
      await h.db
        .getRepository(UserTeam)
        .existsBy({ teamId: created.id, userId: actors.bob }),
    ).toBe(false);
    expect(h.chatAccess.revokeParticipant).toHaveBeenCalledWith(
      `team:${created.id}`,
      actors.bob,
    );
    await h.db.getRepository(UserTeam).insert({
      teamId: created.id,
      userId: actors.carol,
      role: 'member',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await h.delete(`/team/${created.id}/members/${actors.carol}`).expect(200);
    await h.delete(`/team/${created.id}`).expect(200);
    expect(h.chatAccess.revokeParticipant).toHaveBeenCalledWith(
      `team:${created.id}`,
      actors.alice,
    );
    await h.get('/team/members').query({ teamId: created.id }).expect(404);
  });

  it('preserves teams registered in a league', async () => {
    const created = await team();
    const league = await h
      .post('/leagues')
      .send({
        name: 'Protected league',
        sportId: '1',
        tournamentFormat: 'round_robin',
        groupCount: 2,
        qualifiersPerGroup: 2,
      })
      .expect(201);
    await h
      .post(`/leagues/${league.body.id}/teams`)
      .send({ teamId: created.id })
      .expect(201);
    await h.delete(`/team/${created.id}`).expect(409);
    expect(h.chatAccess.revokeParticipant).not.toHaveBeenCalled();
  });
});
