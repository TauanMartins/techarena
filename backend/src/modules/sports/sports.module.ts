import { Module } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { SportsController } from './adapters/http/controllers/sports.controller.js';
import { TypeormSportsRepository } from './adapters/persistence/typeorm-sports.repository.js';
import { SportsApplication } from './application/sports.application.js';
import type { SportsRepository } from './application/ports/sports.port.js';
import { SPORTS_REPOSITORY } from './application/ports/sports.port.js';
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
