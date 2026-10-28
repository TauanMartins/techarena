import { parseEnvironment } from './environment.js';

const url = 'postgresql://postgres:secret@localhost:5432/techarena';

describe('environment configuration', () => {
  it('returns typed configuration with a default port', () => {
    expect(parseEnvironment({ DATABASE_URL: url })).toEqual({
      port: 3000,
      database: { url },
    });
    expect(parseEnvironment({ DATABASE_URL: url, PORT: '3100' }).port).toBe(
      3100,
    );
  });

  it.each(['', '0', '65536', '1.5', 'abc', ' 3000'])(
    'rejects an invalid PORT: %s',
    (port) => {
      expect(() => parseEnvironment({ DATABASE_URL: url, PORT: port })).toThrow(
        'PORT',
      );
    },
  );

  it.each([
    undefined,
    '',
    'invalid',
    'https://localhost/database',
    'postgresql://localhost',
  ])('rejects an invalid database URL without exposing it', (databaseUrl) => {
    expect(() => parseEnvironment({ DATABASE_URL: databaseUrl })).toThrow(
      'DATABASE_URL',
    );
  });
});
