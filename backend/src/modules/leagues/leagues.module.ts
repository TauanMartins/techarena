import { Module } from '@nestjs/common';
import { DataSource } from 'typeorm';
import type { ProfileAccess } from '../users/profile/application/ports/profile-access.port.js';
import { PROFILE_ACCESS } from '../users/profile/application/ports/profile-access.port.js';
import { ProfileModule } from '../users/profile/profile.module.js';
import { LeaguesController } from './adapters/http/controllers/leagues.controller.js';
import { TypeormLeagueStore } from './adapters/persistence/typeorm-league-store.js';
import { LeagueOperations } from './application/league-operations.js';
import { LeaguesApplication } from './application/leagues.application.js';
import type { LeagueUseCases } from './application/ports/leagues.port.js';
import { LEAGUE_USE_CASES } from './application/ports/leagues.port.js';

@Module({
  imports: [ProfileModule],
  controllers: [LeaguesController],
  providers: [
    {
      provide: LEAGUE_USE_CASES,
      inject: [DataSource],
      useFactory: (source: DataSource) =>
        new LeagueOperations(new TypeormLeagueStore(source)),
    },
    {
      provide: LeaguesApplication,
      inject: [LEAGUE_USE_CASES, PROFILE_ACCESS],
      useFactory: (repository: LeagueUseCases, profiles: ProfileAccess) =>
        new LeaguesApplication(repository, profiles),
    },
  ],
})
export class LeaguesModule {}
