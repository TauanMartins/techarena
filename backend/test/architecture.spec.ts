import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

it('keeps application/domain independent of frameworks and persistence adapters', () => {
  const root = fileURLToPath(new URL('../src/modules/users/', import.meta.url));
  const files = readdirSync(root, { recursive: true })
    .map(String)
    .filter(
      (path) =>
        /\/(application|domain)\//.test('/' + path) &&
        path.endsWith('.ts') &&
        !path.endsWith('.spec.ts'),
    );
  expect(files.length).toBeGreaterThan(0);
  for (const file of files) {
    const source = readFileSync(join(root, file), 'utf8');
    expect(source, file).not.toMatch(
      /from\s+['"](?:@nestjs|typeorm|class-validator|class-transformer)/,
    );
    expect(source, file).not.toMatch(/from\s+['"][^'"]*adapters\//);
  }
});
