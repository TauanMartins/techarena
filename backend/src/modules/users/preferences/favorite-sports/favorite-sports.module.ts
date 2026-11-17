import { Module } from '@nestjs/common';
import { DataSource } from 'typeorm';
import type { ProfileAccess } from '../../profile/application/ports/profile-access.port.js';
import { PROFILE_ACCESS } from '../../profile/application/ports/profile-access.port.js';
import { ProfileModule } from '../../profile/profile.module.js';
import { FavoriteSportsController } from './adapters/http/controllers/favorite-sports.controller.js';
import { TypeormFavoriteSportsRepository } from './adapters/persistence/typeorm-favorite-sports.repository.js';
import type { FavoriteSportsRepository } from './application/ports/favorite-sports-repository.port.js';
import { FAVORITE_SPORTS_REPOSITORY } from './application/ports/favorite-sports-repository.port.js';
import { FavoriteSportsApplication } from './application/favorite-sports.application.js';
@Module({
  imports: [ProfileModule],
  controllers: [FavoriteSportsController],
  providers: [
    {
      provide: FAVORITE_SPORTS_REPOSITORY,
      inject: [DataSource],
      useFactory: (source: DataSource) =>
        new TypeormFavoriteSportsRepository(source),
    },
    {
      provide: FavoriteSportsApplication,
      inject: [FAVORITE_SPORTS_REPOSITORY, PROFILE_ACCESS],
      useFactory: (
        repository: FavoriteSportsRepository,
        profiles: ProfileAccess,
      ) => new FavoriteSportsApplication(repository, profiles),
    },
  ],
  exports: [],
})
export class FavoriteSportsModule {}
