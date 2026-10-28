import { Module } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { SportsApplication } from './application/sports.application.js';
import { SPORTS_REPOSITORY } from './domain/sports.port.js';
import type { SportsRepository } from './domain/sports.port.js';
import { TypeormSportsRepository } from './adapters/persistence/typeorm-sports.repository.js';
import { SportsController } from './adapters/http/sports.controller.js';
@Module({
  controllers: [SportsController],
  providers: [
    {
      provide: SPORTS_REPOSITORY,
      inject: [DataSource],
      useFactory: (s: DataSource) => new TypeormSportsRepository(s),
    },
    {
      provide: SportsApplication,
      inject: [SPORTS_REPOSITORY],
      useFactory: (r: SportsRepository) => new SportsApplication(r),
    },
  ],
})
export class SportsModule {}
