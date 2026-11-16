import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';
import { readFileSync } from 'node:fs';
import { configureHttp } from '../src/bootstrap/configure-http.js';
import { loadConfiguration } from '../src/config/environment.js';

const expectedVersion = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
).version as string;

describe('Health HTTP API', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureHttp(app, loadConfiguration());
    await app.init();
  });

  it('/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect({ status: 'ok', database: 'up', version: expectedVersion });
  });

  it('uses the same package version in Swagger and documents health version', async () => {
    const response = await request(app.getHttpServer())
      .get('/api-json')
      .expect(200);
    expect(response.body.info.version).toBe(expectedVersion);
    expect(
      response.body.components.schemas.HealthResponseDto.properties.version
        .type,
    ).toBe('string');
  });

  it('removes the scaffold root route', () =>
    request(app.getHttpServer()).get('/').expect(404));

  afterEach(async () => {
    await app.close();
  });
});
