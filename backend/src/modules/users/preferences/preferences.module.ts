import { Module } from '@nestjs/common';
import { ThemeModule } from './theme/theme.module.js';
import { FavoriteSportsModule } from './favorite-sports/favorite-sports.module.js';
@Module({ imports: [ThemeModule, FavoriteSportsModule] })
export class PreferencesModule {}
