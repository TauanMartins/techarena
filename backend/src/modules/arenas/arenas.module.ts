import { Module } from '@nestjs/common';
import { DataSource } from 'typeorm';
import type { ProfileAccess } from '../users/profile/application/ports/profile-access.port.js';
import { PROFILE_ACCESS } from '../users/profile/application/ports/profile-access.port.js';
import { ProfileModule } from '../users/profile/profile.module.js';
import {
  ArenaCatalogController,
  ArenaManagementController,
} from './adapters/http/controllers/arenas.controller.js';
import { TypeormArenasRepository } from './adapters/persistence/typeorm-arenas.repository.js';
import {
  ArenaCatalogApplication,
  ArenaManagementApplication,
} from './application/arenas.application.js';
import type { ArenasRepository } from './application/ports/arenas.port.js';
import { ARENAS_REPOSITORY } from './application/ports/arenas.port.js';
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
