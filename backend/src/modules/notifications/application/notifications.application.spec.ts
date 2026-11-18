import { describe, it, expect, vi } from 'vitest';
import { NotificationsApplication } from './notifications.application.js';
const notification = {
  recipientId: '11111111-1111-4111-8111-111111111111',
  eventKey: 'event:1',
  kind: 'system.info',
  title: 'Novidade',
  body: 'Uma atualização',
  targetPath: '/social',
};

describe('Notification producer', () => {
  it('validates the content before delegating to the idempotent store', async () => {
    const insertOnce = vi.fn().mockResolvedValue(undefined);
    const app = new NotificationsApplication({ insertOnce });
    await app.publish(notification);
    expect(insertOnce).toHaveBeenCalledWith(notification);
    for (const invalid of [
      { recipientId: 'bad' },
      { title: '' },
      { body: 'x'.repeat(501) },
      { eventKey: '' },
      { targetPath: '//evil.test' },
      { targetPath: '/chat/../../logout' },
      { kind: 'bad kind' },
    ]) {
      await expect(
        app.publish({ ...notification, ...invalid }),
      ).rejects.toThrow('Invalid notification');
    }
    expect(insertOnce).toHaveBeenCalledTimes(1);
  });
  it('propagates delivery failures so a future outbox can retry rather than silently lose them', async () => {
    const app = new NotificationsApplication({
      insertOnce: vi.fn().mockRejectedValue(new Error('offline')),
    });
    await expect(app.publish(notification)).rejects.toThrow('offline');
  });
});
