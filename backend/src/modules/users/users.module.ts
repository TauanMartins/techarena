import { Module } from '@nestjs/common';
import { DirectoryModule } from './directory/directory.module.js';
import { MembershipsModule } from './memberships/memberships.module.js';
import { PreferencesModule } from './preferences/preferences.module.js';
import { ProfileModule } from './profile/profile.module.js';
@Module({
  imports: [
    ProfileModule,
    DirectoryModule,
    PreferencesModule,
    MembershipsModule,
  ],
})
export class UsersModule {}
