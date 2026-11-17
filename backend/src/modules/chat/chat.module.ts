import { Module } from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
  APP_CONFIGURATION,
  ConfigurationModule,
} from '../../config/configuration.module.js';
import type { AppConfiguration } from '../../config/environment.js';
import { ChatAccessController } from './adapters/http/controllers/chat-access.controller.js';
import { TypeormChatAuthorization } from './adapters/persistence/typeorm-chat-authorization.js';
import { SupabaseChatProvisioning } from './adapters/supabase/supabase-chat-provisioning.js';
import { ChatAccessApplication } from './application/chat-access.application.js';
import { CHAT_ACCESS } from './application/ports/chat-access.port.js';

@Module({
  imports: [ConfigurationModule],
  controllers: [ChatAccessController],
  providers: [
    {
      provide: CHAT_ACCESS,
      inject: [DataSource, APP_CONFIGURATION],
      useFactory: (dataSource: DataSource, configuration: AppConfiguration) =>
        new ChatAccessApplication(
          new TypeormChatAuthorization(dataSource),
          new SupabaseChatProvisioning(configuration),
        ),
    },
  ],
  exports: [CHAT_ACCESS],
})
export class ChatModule {}
