import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import source from '../src/database/data-source.js';
import { loadConfiguration } from '../src/config/environment.js';
import { assertDatabaseReady } from '../src/database/database-readiness.js';
import { DatabaseReadinessService } from '../src/database/database-readiness.service.js';
import { HealthController } from '../src/health/health.controller.js';

describe('Database readiness against real PostgreSQL', () => {
  beforeAll(async () => {
    if (!new URL(loadConfiguration().database.url).pathname.endsWith('_test'))
      throw new Error(
        'Database regression tests require a dedicated _test database',
      );
    await source.initialize();
  });
  afterAll(async () => {
    if (source.isInitialized) await source.destroy();
  });

  it('resolves every entity column and has no schema differences after migrations', async () => {
    await expect(assertDatabaseReady(source)).resolves.toBeUndefined();
    const schema = await source.driver.createSchemaBuilder().log();
    expect(schema.upQueries).toEqual([]);
  });

  it('refuses startup and reports unhealthy with a pending workflow migration', async () => {
    await source.undoLastMigration();
    try {
      // Reproduces the reported error before testing the protection against it.
      await expect(
        source.query('SELECT arena_id FROM public.appointment LIMIT 0'),
      ).rejects.toMatchObject({ driverError: { code: '42703' } });
      const module = await Test.createTestingModule({
        providers: [
          DatabaseReadinessService,
          { provide: DataSource, useValue: source },
        ],
      }).compile();
      const app = module.createNestApplication();
      try {
        await expect(app.init()).rejects.toThrow('pending migrations');
        await expect(
          new HealthController(source).check(),
        ).rejects.toMatchObject({ status: 503 });
      } finally {
        await app.close();
      }
    } finally {
      await source.runMigrations();
    }
    await expect(assertDatabaseReady(source)).resolves.toBeUndefined();
  });

  it('detects missing columns even when the migration history is current', async () => {
    await source.query(
      'ALTER TABLE public.arena RENAME COLUMN is_league_only TO renamed_for_regression',
    );
    try {
      expect(await source.showMigrations()).toBe(false);
      await expect(assertDatabaseReady(source)).rejects.toThrow('Arena');
    } finally {
      await source.query(
        'ALTER TABLE public.arena RENAME COLUMN renamed_for_regression TO is_league_only',
      );
    }
    await expect(assertDatabaseReady(source)).resolves.toBeUndefined();
  });
});
