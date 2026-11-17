import { Module } from '@nestjs/common';
import { DataSource } from 'typeorm';
import type { ProfileAccess } from '../users/profile/application/ports/profile-access.port.js';
import { PROFILE_ACCESS } from '../users/profile/application/ports/profile-access.port.js';
import { ProfileModule } from '../users/profile/profile.module.js';
import {
  TeamCatalogController,
  TeamManagementController,
  TeamRequestsController,
} from './adapters/http/controllers/teams.controller.js';
import { TypeormTeamsRepository } from './adapters/persistence/typeorm-teams.repository.js';
import {
  TeamCatalogApplication,
  TeamManagementApplication,
  TeamRequestsApplication,
} from './application/teams.application.js';
import type { TeamsRepository } from './application/ports/teams.port.js';
import { TEAMS_REPOSITORY } from './application/ports/teams.port.js';
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
