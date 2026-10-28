import { Module } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AppointmentMembershipsController } from './adapters/http/appointment-memberships.controller.js';
import { AppointmentMembershipsApplication } from './application/appointment-memberships.application.js';
import { APPOINTMENT_MEMBERSHIPS_REPOSITORY } from './domain/appointment-memberships-repository.port.js';
import type { AppointmentMembershipsRepository } from './domain/appointment-memberships-repository.port.js';
import { TypeormAppointmentMembershipsRepository } from './adapters/persistence/typeorm-appointment-memberships.repository.js';
import { ProfileModule } from '../../profile/profile.module.js';
import { PROFILE_ACCESS } from '../../profile/application/profile-access.port.js';
import type { ProfileAccess } from '../../profile/application/profile-access.port.js';
@Module({
  imports: [ProfileModule],
  controllers: [AppointmentMembershipsController],
  providers: [
    {
      provide: APPOINTMENT_MEMBERSHIPS_REPOSITORY,
      inject: [DataSource],
      useFactory: (source: DataSource) =>
        new TypeormAppointmentMembershipsRepository(source),
    },
    {
      provide: AppointmentMembershipsApplication,
      inject: [APPOINTMENT_MEMBERSHIPS_REPOSITORY, PROFILE_ACCESS],
      useFactory: (
        repository: AppointmentMembershipsRepository,
        profiles: ProfileAccess,
      ) => new AppointmentMembershipsApplication(repository, profiles),
    },
  ],
  exports: [],
})
export class AppointmentMembershipsModule {}
