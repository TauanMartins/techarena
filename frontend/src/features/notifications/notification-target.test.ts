import { expect, it } from 'vitest';
import { notificationTarget } from './notification-target';
it('accepts only known in-app destinations', () => {
  for (const path of [
    '/social',
    '/chat/direct/123',
    '/ligas/4',
    '/notificacoes',
  ])
    expect(notificationTarget(path)).toBe(path);
  for (const path of [
    null,
    '//evil.test',
    'javascript:alert(1)',
    '/social/../logout',
    '/social/%2f%2fevil',
    '/unknown',
    '/social?next=https://evil.test',
  ])
    expect(notificationTarget(path)).toBeNull();
});
