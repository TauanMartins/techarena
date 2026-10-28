import { Module } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ThemeController } from './adapters/http/theme.controller.js';
import { ThemeApplication } from './application/theme.application.js';
import { THEME_REPOSITORY } from './domain/theme-repository.port.js';
import type { ThemeRepository } from './domain/theme-repository.port.js';
import { TypeormThemeRepository } from './adapters/persistence/typeorm-theme.repository.js';
import { ProfileModule } from '../../profile/profile.module.js';
import { PROFILE_ACCESS } from '../../profile/application/profile-access.port.js';
import type { ProfileAccess } from '../../profile/application/profile-access.port.js';
@Module({
  imports: [ProfileModule],
  controllers: [ThemeController],
  providers: [
    {
      provide: THEME_REPOSITORY,
      inject: [DataSource],
      useFactory: (source: DataSource) => new TypeormThemeRepository(source),
    },
    {
      provide: ThemeApplication,
      inject: [THEME_REPOSITORY, PROFILE_ACCESS],
      useFactory: (repository: ThemeRepository, profiles: ProfileAccess) =>
        new ThemeApplication(repository, profiles),
    },
  ],
  exports: [],
})
export class ThemeModule {}
