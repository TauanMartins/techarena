import { Module } from '@nestjs/common';
import { DataSource } from 'typeorm';
import type { ProfileAccess } from '../../profile/application/ports/profile-access.port.js';
import { PROFILE_ACCESS } from '../../profile/application/ports/profile-access.port.js';
import { ProfileModule } from '../../profile/profile.module.js';
import { ThemeController } from './adapters/http/controllers/theme.controller.js';
import { TypeormThemeRepository } from './adapters/persistence/typeorm-theme.repository.js';
import type { ThemeRepository } from './application/ports/theme-repository.port.js';
import { THEME_REPOSITORY } from './application/ports/theme-repository.port.js';
import { ThemeApplication } from './application/theme.application.js';
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
