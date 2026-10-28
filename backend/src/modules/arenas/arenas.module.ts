import { Module } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ProfileModule } from '../users/profile/profile.module.js';
import { PROFILE_ACCESS } from '../users/profile/application/profile-access.port.js';
import type { ProfileAccess } from '../users/profile/application/profile-access.port.js';
import { ARENAS_REPOSITORY } from './domain/arenas.port.js';
import type { ArenasRepository } from './domain/arenas.port.js';
import { TypeormArenasRepository } from './adapters/persistence/typeorm-arenas.repository.js';
import {
  ArenaCatalogController,
  ArenaManagementController,
} from './adapters/http/arenas.controller.js';
import {
  ArenaCatalogApplication,
  ArenaManagementApplication,
} from './application/arenas.application.js';
@Module({
  imports: [ProfileModule],
  controllers: [ArenaCatalogController, ArenaManagementController],
  providers: [
    {
      provide: ARENAS_REPOSITORY,
      inject: [DataSource],
      useFactory: (s: DataSource) => new TypeormArenasRepository(s),
    },
    ...[ArenaCatalogApplication, ArenaManagementApplication].map((provide) => ({
      provide,
      inject: [ARENAS_REPOSITORY, PROFILE_ACCESS],
      useFactory: (r: ArenasRepository, p: ProfileAccess) => new provide(r, p),
    })),
  ],
})
export class ArenasModule {}
