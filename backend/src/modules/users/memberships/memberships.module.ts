import { Module } from '@nestjs/common';
import { TeamMembershipsModule } from './teams/team-memberships.module.js';
import { AppointmentMembershipsModule } from './appointments/appointment-memberships.module.js';
@Module({ imports: [TeamMembershipsModule, AppointmentMembershipsModule] })
export class MembershipsModule {}
