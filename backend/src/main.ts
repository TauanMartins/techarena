import { NestFactory } from '@nestjs/core';
import { configureHttp } from './bootstrap/configure-http.js';
import { APP_CONFIGURATION } from './config/configuration.module.js';
import type { AppConfiguration } from './config/environment.js';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configuration = app.get<AppConfiguration>(APP_CONFIGURATION);
  configureHttp(app, configuration);
  await app.listen(configuration.port);
}
await bootstrap();
