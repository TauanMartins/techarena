import { Module } from '@nestjs/common';
import { AppointmentMembershipsModule } from './appointments/appointment-memberships.module.js';
import { TeamMembershipsModule } from './teams/team-memberships.module.js';
@Module({ imports: [TeamMembershipsModule, AppointmentMembershipsModule] })
export class MembershipsModule {}
