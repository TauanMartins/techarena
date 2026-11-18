import { expect, it } from 'vitest';
import { notificationQueryPrefixes } from './notification-query-prefixes';
it('targets the affected domain without executing arbitrary cache instructions', () => {
  expect(notificationQueryPrefixes('friend.requested')).toContain('community');
  expect(notificationQueryPrefixes('team.invited')).toContain('teamRequests');
  expect(notificationQueryPrefixes('appointment.joined')).toContain(
    'appointments',
  );
  expect(notificationQueryPrefixes('chat.message')).toEqual([
    'chatConversations',
  ]);
  expect(notificationQueryPrefixes('unknown.code')).toEqual([]);
  expect(notificationQueryPrefixes()).toContain('community');
});
