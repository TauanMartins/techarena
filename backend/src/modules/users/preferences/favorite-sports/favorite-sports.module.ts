import { Module } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { FavoriteSportsController } from './adapters/http/favorite-sports.controller.js';
import { FavoriteSportsApplication } from './application/favorite-sports.application.js';
import { FAVORITE_SPORTS_REPOSITORY } from './domain/favorite-sports-repository.port.js';
import type { FavoriteSportsRepository } from './domain/favorite-sports-repository.port.js';
import { TypeormFavoriteSportsRepository } from './adapters/persistence/typeorm-favorite-sports.repository.js';
import { ProfileModule } from '../../profile/profile.module.js';
import { PROFILE_ACCESS } from '../../profile/application/profile-access.port.js';
import type { ProfileAccess } from '../../profile/application/profile-access.port.js';
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
