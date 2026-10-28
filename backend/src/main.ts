import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { createValidationPipe } from './common/validation.js';
import { APP_CONFIGURATION } from './config/configuration.module.js';
import type { AppConfiguration } from './config/environment.js';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(createValidationPipe());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('TechArena API')
    .setDescription('API documentation for the TechArena backend.')
    .addBearerAuth()
    .setVersion('1.0.0')
    .build();
  const swaggerDocument = () =>
    SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, swaggerDocument);

  const configuration = app.get<AppConfiguration>(APP_CONFIGURATION);
  app.enableCors({
    origin: configuration.cors.origins,
    credentials: false,
    allowedHeaders: ['Authorization', 'Content-Type'],
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  });
  await app.listen(configuration.port);
}
await bootstrap();
