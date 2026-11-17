import ts from 'typescript';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

it('keeps application/domain independent of frameworks and persistence adapters', () => {
  const root = fileURLToPath(new URL('../src/modules/', import.meta.url));
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
    if (file.includes('/domain/')) {
      expect(source, file).not.toMatch(/from\s+['"][^'"]*application\//);
    }
    expect(source, file).not.toMatch(
      /\b(?:SELECT|INSERT INTO|UPDATE|DELETE FROM)\s+[a-z_]/,
    );
  }
});

it('limits source files to one class and fewer than 1000 lines', () => {
  const root = fileURLToPath(new URL('../src/', import.meta.url));
  for (const file of readdirSync(root, { recursive: true })
    .map(String)
    .filter((file) => file.endsWith('.ts') && !file.endsWith('.spec.ts'))) {
    const source = readFileSync(join(root, file), 'utf8');
    const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
    expect(
      ast.statements.filter(ts.isClassDeclaration).length,
      file,
    ).toBeLessThanOrEqual(1);
    expect(source.split('\n').length, file).toBeLessThan(1000);
    const functions = ast.statements.filter(ts.isFunctionDeclaration);
    const publicFunctions = functions.filter((fn) =>
      fn.modifiers?.some(
        (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
      ),
    );
    const independent = publicFunctions.filter(
      (fn) =>
        !functions.some(
          (other) =>
            other !== fn &&
            new RegExp('\\b' + fn.name?.text + '\\s*\\(').test(
              other.body?.getText(ast) ?? '',
            ),
        ),
    );
    expect(independent.length, file).toBeLessThanOrEqual(1);
  }
});
