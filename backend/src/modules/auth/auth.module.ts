import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import {
  APP_CONFIGURATION,
  ConfigurationModule,
} from '../../config/configuration.module.js';
import type { AppConfiguration } from '../../config/environment.js';
import { ACCESS_TOKEN_VERIFIER } from './domain/access-token-verifier.port.js';
import { SupabaseTokenVerifier } from './adapters/supabase/supabase-token-verifier.js';
import { AccessTokenGuard } from './adapters/http/access-token.guard.js';

@Module({
  imports: [ConfigurationModule],
  providers: [
    {
      provide: ACCESS_TOKEN_VERIFIER,
      inject: [APP_CONFIGURATION],
      useFactory: (configuration: AppConfiguration) =>
        new SupabaseTokenVerifier(configuration.auth.projectUrl),
    },
    { provide: APP_GUARD, useClass: AccessTokenGuard },
  ],
})
export class AuthModule {}
