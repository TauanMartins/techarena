import { readFile, readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import pg from 'pg';

// Never run this helper against a remote or non-test database. It creates a fresh database.
const source = new URL(process.env.DATABASE_URL ?? '');
if (
  !['127.0.0.1', 'localhost', '[::1]'].includes(source.hostname) ||
  !source.pathname.endsWith('_test')
) {
  throw new Error(
    'Notification SQL tests require a loopback *_test database on a disposable PostgreSQL server',
  );
}
const name = `notifications_${randomUUID().replaceAll('-', '')}_test`;
const admin = new pg.Client({ connectionString: source.href });
await admin.connect();
let client;
let created = false;
try {
  await admin.query(`CREATE DATABASE ${name}`);
  created = true;
  source.pathname = `/${name}`;
  const migration = spawnSync('npm', ['run', 'db:migrate'], {
    cwd: new URL('..', import.meta.url),
    env: { ...process.env, DATABASE_URL: source.href },
    stdio: 'inherit',
  });
  if (migration.status !== 0)
    throw new Error('Backend migration failed in notification test database');
  client = new pg.Client({ connectionString: source.href });
  await client.connect();
  const root = new URL('../../supabase/', import.meta.url);
  await client.query(
    await readFile(new URL('tests/support/bootstrap.sql', root), 'utf8'),
  );
  for (const file of (await readdir(new URL('migrations/', root)))
    .filter((file) => file.endsWith('.sql'))
    .sort()) {
    await client.query(
      await readFile(new URL(`migrations/${file}`, root), 'utf8'),
    );
  }
  for (const file of ['notification_inbox.sql', 'notification_events.sql']) {
    await client.query(await readFile(new URL(`tests/${file}`, root), 'utf8'));
    console.log(`PASS ${file}`);
  }
} finally {
  await client?.end();
  if (created) await admin.query(`DROP DATABASE ${name} WITH (FORCE)`);
  await admin.end();
}
