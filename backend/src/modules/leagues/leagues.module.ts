import { Module } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ProfileModule } from '../users/profile/profile.module.js';
import { PROFILE_ACCESS } from '../users/profile/application/profile-access.port.js';
import type { ProfileAccess } from '../users/profile/application/profile-access.port.js';
import { LeaguesApplication } from './application/leagues.application.js';
import { LeaguesController } from './adapters/http/leagues.controller.js';
import { TypeormLeaguesRepository } from './adapters/persistence/typeorm-leagues.repository.js';
import { LEAGUES_REPOSITORY } from './application/leagues.port.js';
import type { LeaguesRepository } from './application/leagues.port.js';

@Module({
  imports: [ProfileModule],
  controllers: [LeaguesController],
  providers: [
    {
      provide: LEAGUES_REPOSITORY,
      inject: [DataSource],
      useFactory: (source: DataSource) => new TypeormLeaguesRepository(source),
    },
    {
      provide: LeaguesApplication,
      inject: [LEAGUES_REPOSITORY, PROFILE_ACCESS],
      useFactory: (repository: LeaguesRepository, profiles: ProfileAccess) =>
        new LeaguesApplication(repository, profiles),
    },
  ],
})
export class LeaguesModule {}
