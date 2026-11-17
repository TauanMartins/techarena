import { Module } from '@nestjs/common';
import { DataSource } from 'typeorm';
import type { ProfileAccess } from '../../profile/application/ports/profile-access.port.js';
import { PROFILE_ACCESS } from '../../profile/application/ports/profile-access.port.js';
import { ProfileModule } from '../../profile/profile.module.js';
import { AppointmentMembershipsController } from './adapters/http/controllers/appointment-memberships.controller.js';
import { TypeormAppointmentMembershipsRepository } from './adapters/persistence/typeorm-appointment-memberships.repository.js';
import type { AppointmentMembershipsRepository } from './application/ports/appointment-memberships-repository.port.js';
import { APPOINTMENT_MEMBERSHIPS_REPOSITORY } from './application/ports/appointment-memberships-repository.port.js';
import { AppointmentMembershipsApplication } from './application/appointment-memberships.application.js';
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
