import { Module } from '@nestjs/common';
import { FavoriteSportsModule } from './favorite-sports/favorite-sports.module.js';
import { ThemeModule } from './theme/theme.module.js';
@Module({ imports: [ThemeModule, FavoriteSportsModule] })
export class PreferencesModule {}
