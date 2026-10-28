import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  APP_CONFIGURATION,
  ConfigurationModule,
} from './config/configuration.module.js';
import { databaseOptions } from './database/database.options.js';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ResponseValidationInterceptor } from './common/http/response-validation.interceptor.js';
import { HealthModule } from './health/health.module.js';

@Module({
  imports: [
    HealthModule,
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
