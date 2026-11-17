import { Module } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ProfileController } from './adapters/http/controllers/profile.controller.js';
import { TypeormProfileRepository } from './adapters/persistence/typeorm-profile.repository.js';
import { PROFILE_ACCESS } from './application/ports/profile-access.port.js';
import type { ProfileRepository } from './application/ports/profile-repository.port.js';
import { PROFILE_REPOSITORY } from './application/ports/profile-repository.port.js';
import { ProfileApplication } from './application/profile.application.js';
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
