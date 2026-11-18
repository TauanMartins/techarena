import type { NewNotification } from '../domain/new-notification.js';
import { validateNotification } from '../domain/validate-notification.js';
import type { NotificationStore } from './ports/notification-store.port.js';

export const NOTIFICATIONS = Symbol('NOTIFICATIONS');

/** Inbox producer boundary. Future business flows should call it from an outbox consumer. */
export class NotificationsApplication {
  constructor(private readonly store: NotificationStore) {}
  async publish(notification: NewNotification): Promise<void> {
    validateNotification(notification);
    await this.store.insertOnce(notification);
  }
}
