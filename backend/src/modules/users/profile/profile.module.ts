import { Module } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ProfileController } from './adapters/http/profile.controller.js';
import { ProfileApplication } from './application/profile.application.js';
import { PROFILE_REPOSITORY } from './domain/profile-repository.port.js';
import type { ProfileRepository } from './domain/profile-repository.port.js';
import { TypeormProfileRepository } from './adapters/persistence/typeorm-profile.repository.js';
import { PROFILE_ACCESS } from './application/profile-access.port.js';
@Module({
  imports: [],
  controllers: [ProfileController],
  providers: [
    {
      provide: PROFILE_REPOSITORY,
      inject: [DataSource],
      useFactory: (source: DataSource) => new TypeormProfileRepository(source),
    },
    {
      provide: ProfileApplication,
      inject: [PROFILE_REPOSITORY],
      useFactory: (repository: ProfileRepository) =>
        new ProfileApplication(repository),
    },
    { provide: PROFILE_ACCESS, useExisting: ProfileApplication },
  ],
  exports: [PROFILE_ACCESS],
})
export class ProfileModule {}
