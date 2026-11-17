import { Module } from '@nestjs/common';
import { DataSource } from 'typeorm';
import type { ProfileAccess } from '../../profile/application/ports/profile-access.port.js';
import { PROFILE_ACCESS } from '../../profile/application/ports/profile-access.port.js';
import { ProfileModule } from '../../profile/profile.module.js';
import { TeamMembershipsController } from './adapters/http/controllers/team-memberships.controller.js';
import { TypeormTeamMembershipsRepository } from './adapters/persistence/typeorm-team-memberships.repository.js';
import type { TeamMembershipsRepository } from './application/ports/team-memberships-repository.port.js';
import { TEAM_MEMBERSHIPS_REPOSITORY } from './application/ports/team-memberships-repository.port.js';
import { TeamMembershipsApplication } from './application/team-memberships.application.js';
@Module({
  imports: [ProfileModule],
  controllers: [TeamMembershipsController],
  providers: [
    {
      provide: TEAM_MEMBERSHIPS_REPOSITORY,
      inject: [DataSource],
      useFactory: (source: DataSource) =>
        new TypeormTeamMembershipsRepository(source),
    },
    {
      provide: TeamMembershipsApplication,
      inject: [TEAM_MEMBERSHIPS_REPOSITORY, PROFILE_ACCESS],
      useFactory: (
        repository: TeamMembershipsRepository,
        profiles: ProfileAccess,
      ) => new TeamMembershipsApplication(repository, profiles),
    },
  ],
  exports: [],
})
export class TeamMembershipsModule {}
