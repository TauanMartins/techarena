import {
  BadGatewayException,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { AppConfiguration } from '../../../../config/environment.js';
import type { NewNotification } from '../../domain/new-notification.js';
import type { NotificationStore } from '../../application/ports/notification-store.port.js';

export class SupabaseNotificationStore implements NotificationStore {
  constructor(private readonly configuration: AppConfiguration) {}
  async insertOnce(notification: NewNotification): Promise<void> {
    const { projectUrl, serviceRoleKey } = this.configuration.auth;
    if (!projectUrl || !serviceRoleKey)
      throw new ServiceUnavailableException('Notifications are not configured');
    const headers: Record<string, string> = {
      apikey: serviceRoleKey,
      'Content-Type': 'application/json',
      Prefer: 'resolution=ignore-duplicates,return=minimal',
    };
    if (!serviceRoleKey.startsWith('sb_secret_'))
      headers.Authorization = `Bearer ${serviceRoleKey}`;
    const response = await fetch(
      `${projectUrl}/rest/v1/notifications?on_conflict=recipient_id,event_key`,
      {
        method: 'POST',
        headers,
        signal: AbortSignal.timeout(10_000),
        body: JSON.stringify({
          recipient_id: notification.recipientId,
          event_key: notification.eventKey,
          kind: notification.kind,
          title: notification.title,
          body: notification.body,
          target_path: notification.targetPath ?? null,
        }),
      },
    );
    if (!response.ok)
      throw new BadGatewayException('Unable to persist notification');
  }
}
