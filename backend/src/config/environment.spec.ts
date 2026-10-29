import { parseEnvironment } from './environment.js';

const url = 'postgresql://postgres:secret@localhost:5432/techarena';

describe('environment configuration', () => {
  it('returns typed configuration with a default port', () => {
    expect(parseEnvironment({ DATABASE_URL: url })).toEqual({
      port: 3000,
      auth: { projectUrl: null, serviceRoleKey: null },
      cors: { origins: ['http://localhost:4200'] },
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

it('requires a Supabase project URL when a service role key is configured', () => {
  expect(() =>
    parseEnvironment({
      DATABASE_URL: url,
      SUPABASE_SERVICE_ROLE_KEY: 'secret',
    }),
  ).toThrow('SUPABASE_URL');
  expect(
    parseEnvironment({
      DATABASE_URL: url,
      SUPABASE_URL: 'https://project.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: ' secret ',
    }).auth.serviceRoleKey,
  ).toBe('secret');
});

it.each([
  'http://project.supabase.co',
  'https://project.supabase.co/path',
  'https://user:pass@project.supabase.co',
])('rejects invalid Supabase origins', (projectUrl) => {
  expect(() =>
    parseEnvironment({ DATABASE_URL: url, SUPABASE_URL: projectUrl }),
  ).toThrow('SUPABASE_URL');
});
it('rejects wildcard CORS and accepts explicit origins', () => {
  expect(() =>
    parseEnvironment({ DATABASE_URL: url, CORS_ORIGINS: '*' }),
  ).toThrow('CORS_ORIGINS');
  expect(
    parseEnvironment({
      DATABASE_URL: url,
      CORS_ORIGINS: 'http://localhost:4200,https://app.example.test',
    }).cors.origins,
  ).toHaveLength(2);
});
