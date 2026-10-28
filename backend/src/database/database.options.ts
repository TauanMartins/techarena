import { fileURLToPath } from 'node:url';
import type { DataSourceOptions } from 'typeorm';
import type { AppConfiguration } from '../config/environment.js';
import * as entities from './entities/index.js';

export function databaseOptions(
  configuration: AppConfiguration,
): DataSourceOptions {
  return {
    type: 'postgres',
    url: configuration.database.url,
    schema: 'public',
    extra: { options: '-c search_path=public,extensions' },
    entities: Object.values(entities),
    migrations: [
      fileURLToPath(new URL('./migrations/*{.ts,.js}', import.meta.url)),
    ],
    migrationsTableName: 'typeorm_migrations',
    migrationsTransactionMode: 'all',
    synchronize: false,
    migrationsRun: false,
    installExtensions: false,
  };
}
