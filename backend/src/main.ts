import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { APP_CONFIGURATION } from './config/configuration.module.js';
import type { AppConfiguration } from './config/environment.js';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const swaggerConfig = new DocumentBuilder()
    .setTitle('TechArena API')
    .setDescription('API documentation for the TechArena backend.')
    .setVersion('1.0.0')
    .build();
  const swaggerDocument = () =>
    SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, swaggerDocument);

  const configuration = app.get<AppConfiguration>(APP_CONFIGURATION);
  await app.listen(configuration.port);
}
await bootstrap();
