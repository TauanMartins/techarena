import { Module } from '@nestjs/common';
import { DataSource } from 'typeorm';
import type { ChatAccessPort } from '../chat/application/ports/chat-access.port.js';
import { CHAT_ACCESS } from '../chat/application/ports/chat-access.port.js';
import { ChatModule } from '../chat/chat.module.js';
import type { ProfileAccess } from '../users/profile/application/ports/profile-access.port.js';
import { PROFILE_ACCESS } from '../users/profile/application/ports/profile-access.port.js';
import { ProfileModule } from '../users/profile/profile.module.js';
import { FriendsController } from './adapters/http/controllers/friends.controller.js';
import { TypeormFriendsRepository } from './adapters/persistence/typeorm-friends.repository.js';
import { FriendsApplication } from './application/friends.application.js';
import type { FriendsRepository } from './application/ports/friends.port.js';
import { FRIENDS_REPOSITORY } from './application/ports/friends.port.js';
@Module({
  imports: [ProfileModule, ChatModule],
  controllers: [FriendsController],
  providers: [
    {
      provide: FRIENDS_REPOSITORY,
      inject: [DataSource],
      useFactory: (s: DataSource) => new TypeormFriendsRepository(s),
    },
    {
      provide: FriendsApplication,
      inject: [FRIENDS_REPOSITORY, PROFILE_ACCESS, CHAT_ACCESS],
      useFactory: (r: FriendsRepository, p: ProfileAccess, c: ChatAccessPort) =>
        new FriendsApplication(r, p, c),
    },
  ],
})
export class FriendsModule {}
