import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { createValidationPipe } from '../common/validation.js';
import { DomainErrorFilter } from '../common/http/domain-error.filter.js';
import type { AppConfiguration } from '../config/environment.js';
import { APPLICATION_VERSION } from '../config/application-version.js';

/** Share the real HTTP pipeline with end-to-end tests. */
export function configureHttp(
  app: INestApplication,
  configuration: AppConfiguration,
): void {
  app.useGlobalPipes(createValidationPipe());
  app.useGlobalFilters(new DomainErrorFilter());
  app.enableCors({
    origin: configuration.cors.origins,
    credentials: false,
    allowedHeaders: ['Authorization', 'Content-Type'],
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  });
  const config = new DocumentBuilder()
    .setTitle('TechArena API')
    .setDescription('Documentação da API do backend TechArena.')
    .addBearerAuth()
    .setVersion(APPLICATION_VERSION)
    .build();
  SwaggerModule.setup('api', app, () =>
    SwaggerModule.createDocument(app, config),
  );
}
