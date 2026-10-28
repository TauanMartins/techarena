import { assertMembershipDecision } from './team-policy.js';
it('keeps the two sides of membership consent distinct', () => {
  expect(() =>
    assertMembershipDecision('invitation', 'captain', 'target', true),
  ).toThrow();
  expect(() =>
    assertMembershipDecision('invitation', 'target', 'target', false),
  ).not.toThrow();
  expect(() =>
    assertMembershipDecision('request', 'target', 'target', false),
  ).toThrow();
  expect(() =>
    assertMembershipDecision('request', 'captain', 'target', true),
  ).not.toThrow();
});
