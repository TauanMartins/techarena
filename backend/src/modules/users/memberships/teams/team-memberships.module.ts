import { Module } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TeamMembershipsController } from './adapters/http/team-memberships.controller.js';
import { TeamMembershipsApplication } from './application/team-memberships.application.js';
import { TEAM_MEMBERSHIPS_REPOSITORY } from './domain/team-memberships-repository.port.js';
import type { TeamMembershipsRepository } from './domain/team-memberships-repository.port.js';
import { TypeormTeamMembershipsRepository } from './adapters/persistence/typeorm-team-memberships.repository.js';
import { ProfileModule } from '../../profile/profile.module.js';
import { PROFILE_ACCESS } from '../../profile/application/profile-access.port.js';
import type { ProfileAccess } from '../../profile/application/profile-access.port.js';
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
