import { Module } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { UserApplication } from './application/user.application.js';
import { USER_REPOSITORY } from './domain/user-repository.port.js';
import type { UserRepository } from './domain/user-repository.port.js';
import { UsersController } from './adapters/http/users.controller.js';
import { TypeormUserRepository } from './adapters/persistence/typeorm-user.repository.js';

@Module({
  controllers: [UsersController],
  providers: [
    {
      provide: USER_REPOSITORY,
      inject: [DataSource],
      useFactory: (source: DataSource) => new TypeormUserRepository(source),
    },
    {
      provide: UserApplication,
      inject: [USER_REPOSITORY],
      useFactory: (repository: UserRepository) =>
        new UserApplication(repository),
    },
  ],
})
export class UsersModule {}
