import { Module } from '@nestjs/common';
import {
  APP_CONFIGURATION,
  ConfigurationModule,
} from '../../config/configuration.module.js';
import type { AppConfiguration } from '../../config/environment.js';
import { SupabaseNotificationStore } from './adapters/supabase/supabase-notification-store.js';
import {
  NOTIFICATIONS,
  NotificationsApplication,
} from './application/notifications.application.js';

@Module({
  imports: [ConfigurationModule],
  providers: [
    {
      provide: NOTIFICATIONS,
      inject: [APP_CONFIGURATION],
      useFactory: (configuration: AppConfiguration) =>
        new NotificationsApplication(
          new SupabaseNotificationStore(configuration),
        ),
    },
  ],
  exports: [NOTIFICATIONS],
})
export class NotificationsModule {}
