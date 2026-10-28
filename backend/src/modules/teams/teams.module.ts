import { Module } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ProfileModule } from '../users/profile/profile.module.js';
import { PROFILE_ACCESS } from '../users/profile/application/profile-access.port.js';
import type { ProfileAccess } from '../users/profile/application/profile-access.port.js';
import { TEAMS_REPOSITORY } from './domain/teams.port.js';
import type { TeamsRepository } from './domain/teams.port.js';
import { TypeormTeamsRepository } from './adapters/persistence/typeorm-teams.repository.js';
import {
  TeamCatalogApplication,
  TeamManagementApplication,
  TeamRequestsApplication,
} from './application/teams.application.js';
import {
  TeamCatalogController,
  TeamManagementController,
  TeamRequestsController,
} from './adapters/http/teams.controller.js';
@Module({
  imports: [ProfileModule],
  controllers: [
    TeamCatalogController,
    TeamManagementController,
    TeamRequestsController,
  ],
  providers: [
    {
      provide: TEAMS_REPOSITORY,
      inject: [DataSource],
      useFactory: (s: DataSource) => new TypeormTeamsRepository(s),
    },
    {
      provide: TeamCatalogApplication,
      inject: [TEAMS_REPOSITORY],
      useFactory: (r: TeamsRepository) => new TeamCatalogApplication(r),
    },
    ...[TeamManagementApplication, TeamRequestsApplication].map((provide) => ({
      provide,
      inject: [TEAMS_REPOSITORY, PROFILE_ACCESS],
      useFactory: (r: TeamsRepository, p: ProfileAccess) => new provide(r, p),
    })),
  ],
})
export class TeamsModule {}
