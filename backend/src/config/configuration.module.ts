import { Module } from '@nestjs/common';
import { loadConfiguration } from './environment.js';

export const APP_CONFIGURATION = Symbol('APP_CONFIGURATION');

@Module({
  providers: [{ provide: APP_CONFIGURATION, useFactory: loadConfiguration }],
  exports: [APP_CONFIGURATION],
})
export class ConfigurationModule {}
