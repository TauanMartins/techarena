import { prepareProfileChanges } from './profile-policy.js';
import type { ProfileChanges } from './profile.js';
const now = new Date('2026-10-28T12:00:00Z');
it('normalizes editable fields without exposing persistence fields', () => {
  expect(
    prepareProfileChanges(
      { name: ' Alice ', username: ' alice ', image: null },
      now,
    ),
  ).toEqual({ name: 'Alice', username: 'alice', image: null });
});
it.each([
  { name: '' },
  { username: 'Alice' },
  { gender: 'invalid' },
  { image: 'http://example.test/a' },
  { permission: 'admin' },
  { email: 'new@example.test' },
])('rejects invalid edits even when called outside HTTP', (change) => {
  expect(() => prepareProfileChanges(change as ProfileChanges, now)).toThrow();
});
