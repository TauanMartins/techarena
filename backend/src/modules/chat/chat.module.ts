import { Module } from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
  APP_CONFIGURATION,
  ConfigurationModule,
} from '../../config/configuration.module.js';
import type { AppConfiguration } from '../../config/environment.js';
import { CHAT_ACCESS } from './application/chat-access.port.js';
import { ChatAccessService } from './adapters/persistence/chat-access.service.js';
import { ChatAccessController } from './adapters/http/chat-access.controller.js';

@Module({
  imports: [ConfigurationModule],
  controllers: [ChatAccessController],
  providers: [
    {
      provide: CHAT_ACCESS,
      inject: [DataSource, APP_CONFIGURATION],
      useFactory: (dataSource: DataSource, configuration: AppConfiguration) =>
        new ChatAccessService(dataSource, configuration),
    },
  ],
  exports: [CHAT_ACCESS],
})
export class ChatModule {}
