import source from './data-source.js';
import { assertDatabaseReady } from './database-readiness.js';

try {
  await source.initialize();
  await assertDatabaseReady(source);
  console.log('Database migrations and entity columns are up to date.');
} finally {
  if (source.isInitialized) await source.destroy();
}
