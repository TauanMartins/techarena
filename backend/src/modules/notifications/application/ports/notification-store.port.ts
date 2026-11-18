import type { NewNotification } from '../../domain/new-notification.js';
export interface NotificationStore {
  insertOnce(notification: NewNotification): Promise<void>;
}
