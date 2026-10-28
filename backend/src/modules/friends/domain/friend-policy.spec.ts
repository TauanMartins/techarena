import { assertFriendDecision } from './friend-policy.js';
const pending = {
  requesterId: 'sender',
  addresseeId: 'receiver',
  status: 'pending',
};
it('requires recipient consent and prevents third-party or repeated acceptance', () => {
  expect(() => assertFriendDecision('sender', pending, 'accept')).toThrow();
  expect(() => assertFriendDecision('stranger', pending, 'block')).toThrow();
  expect(() =>
    assertFriendDecision('receiver', pending, 'accept'),
  ).not.toThrow();
  expect(() =>
    assertFriendDecision(
      'receiver',
      { ...pending, status: 'accepted' },
      'accept',
    ),
  ).toThrow();
});
