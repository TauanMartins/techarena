import { ChatAccessApplication } from './chat-access.application.js';
it('revokes a remote grant when membership is lost during provisioning', async () => {
  const authorization = {
    isAllowed: vi.fn().mockResolvedValueOnce(true).mockResolvedValueOnce(false),
    displayName: vi.fn().mockResolvedValue('Player'),
  };
  const provisioning = {
    grant: vi.fn().mockResolvedValue(undefined),
    revokeParticipant: vi.fn().mockResolvedValue(undefined),
  };
  const app = new ChatAccessApplication(authorization, provisioning);
  await expect(app.ensureAccess('user', 'team:1')).rejects.toMatchObject({
    code: 'CHAT_ACCESS_REVOKED',
  });
  expect(provisioning.grant).toHaveBeenCalledOnce();
  expect(provisioning.revokeParticipant).toHaveBeenCalledWith('team:1', 'user');
});
it('fails closed if membership cannot be rechecked after the remote grant', async () => {
  const failure = new Error('database unavailable');
  const authorization = {
    isAllowed: vi
      .fn()
      .mockResolvedValueOnce(true)
      .mockRejectedValueOnce(failure),
    displayName: vi.fn().mockResolvedValue('Player'),
  };
  const provisioning = {
    grant: vi.fn().mockResolvedValue(undefined),
    revokeParticipant: vi.fn().mockResolvedValue(undefined),
  };
  await expect(
    new ChatAccessApplication(authorization, provisioning).ensureAccess(
      'user',
      'team:1',
    ),
  ).rejects.toBe(failure);
  expect(provisioning.revokeParticipant).toHaveBeenCalledWith('team:1', 'user');
});
