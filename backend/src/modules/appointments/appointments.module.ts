import { Module } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ProfileModule } from '../users/profile/profile.module.js';
import { PROFILE_ACCESS } from '../users/profile/application/profile-access.port.js';
import type { ProfileAccess } from '../users/profile/application/profile-access.port.js';
import { APPOINTMENTS_REPOSITORY } from './application/appointments.port.js';
import type { AppointmentsRepository } from './application/appointments.port.js';
import { TypeormAppointmentsRepository } from './adapters/persistence/typeorm-appointments.repository.js';
import {
  AppointmentsApplication,
  AvailabilityApplication,
} from './application/appointments.application.js';
import {
  AppointmentsController,
  AvailabilityController,
} from './adapters/http/appointments.controller.js';
@Module({
  imports: [ProfileModule],
  controllers: [AppointmentsController, AvailabilityController],
  providers: [
    {
      provide: APPOINTMENTS_REPOSITORY,
      inject: [DataSource],
      useFactory: (s: DataSource) => new TypeormAppointmentsRepository(s),
    },
    {
      provide: AppointmentsApplication,
      inject: [APPOINTMENTS_REPOSITORY, PROFILE_ACCESS],
      useFactory: (r: AppointmentsRepository, p: ProfileAccess) =>
        new AppointmentsApplication(r, p),
    },
    {
      provide: AvailabilityApplication,
      inject: [APPOINTMENTS_REPOSITORY],
      useFactory: (r: AppointmentsRepository) => new AvailabilityApplication(r),
    },
  ],
})
export class AppointmentsModule {}
