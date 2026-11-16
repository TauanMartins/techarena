import { readFileSync } from 'node:fs';

// Both src/config and dist/config resolve to the deployed backend package.
const metadata = JSON.parse(
  readFileSync(new URL('../../package.json', import.meta.url), 'utf8'),
) as { version: string };

export const APPLICATION_VERSION = metadata.version;
