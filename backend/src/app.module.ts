import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  APP_CONFIGURATION,
  ConfigurationModule,
} from './config/configuration.module.js';
import { databaseOptions } from './database/database.options.js';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ResponseValidationInterceptor } from './common/http/response-validation.interceptor.js';
import { SportsModule } from './modules/sports/sports.module.js';
import { ArenasModule } from './modules/arenas/arenas.module.js';
import { AppointmentsModule } from './modules/appointments/appointments.module.js';
import { TeamsModule } from './modules/teams/teams.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { HealthModule } from './health/health.module.js';

@Module({
  imports: [
    HealthModule,
    AuthModule,
    UsersModule,
    SportsModule,
    ArenasModule,
    AppointmentsModule,
    TeamsModule,
    ConfigurationModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigurationModule],
      inject: [APP_CONFIGURATION],
      useFactory: databaseOptions,
    }),
  ],
  providers: [
    { provide: APP_INTERCEPTOR, useClass: ResponseValidationInterceptor },
  ],
})
export class AppModule {}
