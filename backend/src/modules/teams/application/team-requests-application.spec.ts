import { TeamRequestsApplication } from './team-requests-application.js';
import type {
  MembershipRecord,
  TeamsRepository,
  TeamTransaction,
} from './ports/teams.port.js';
const profiles = {
  ensureExists: vi.fn(),
  ensureAdult: vi.fn(),
  ensureAdmin: vi.fn(),
};
const invitation: MembershipRecord = {
  id: 'request',
  teamId: 'team',
  userId: 'guest',
  createdBy: 'captain',
  kind: 'invitation',
  status: 'pending',
};
function setup(row: MembershipRecord, captain = true) {
  const store = {
    request: vi.fn().mockResolvedValue(row),
    pending: vi.fn().mockResolvedValue(row),
    lockTeam: vi.fn().mockResolvedValue({ id: 'team' }),
    isCaptain: vi.fn().mockResolvedValue(captain),
    addMember: vi.fn(),
    setRequestStatus: vi.fn(),
    presentRequest: vi.fn(),
  };
  const repository = {
    transaction: async (work: (tx: TeamTransaction) => Promise<unknown>) =>
      work(store as unknown as TeamTransaction),
  };
  return {
    store,
    app: new TeamRequestsApplication(
      repository as unknown as TeamsRepository,
      profiles,
    ),
  };
}
it('does not allow the captain to accept their own invitation for the recipient', async () => {
  const { app, store } = setup(invitation);
  await expect(
    app.decide('captain', 'team', 'guest', 'accept'),
  ).rejects.toMatchObject({ code: 'INVITATION_REQUIRES_USER' });
  expect(store.addMember).not.toHaveBeenCalled();
});
it('rechecks the inviter authority before admitting the guest', async () => {
  const { app, store } = setup(invitation, false);
  await expect(app.respond('guest', 'request', 'accept')).rejects.toMatchObject(
    { kind: 'forbidden' },
  );
  expect(store.addMember).not.toHaveBeenCalled();
});
it('declining a pending invitation never adds membership', async () => {
  const { app, store } = setup(invitation);
  await app.respond('guest', 'request', 'decline');
  expect(store.addMember).not.toHaveBeenCalled();
  expect(store.setRequestStatus).toHaveBeenCalledWith('request', 'declined');
});
it('does not accept an invitation that closed while waiting for the team lock', async () => {
  const { app, store } = setup(invitation);
  store.request
    .mockResolvedValueOnce(invitation)
    .mockResolvedValueOnce({ ...invitation, status: 'declined' });
  await expect(app.respond('guest', 'request', 'accept')).rejects.toMatchObject(
    { code: 'REQUEST_CLOSED' },
  );
  expect(store.addMember).not.toHaveBeenCalled();
});
