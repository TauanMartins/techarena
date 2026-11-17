import { config } from 'dotenv';

export interface AppConfiguration {
  readonly port: number;
  readonly auth: {
    readonly projectUrl: string | null;
    readonly serviceRoleKey: string | null;
  };
  readonly cors: { readonly origins: string[] };
  readonly database: {
    readonly url: string;
  };
}

/** Parse only the variables used by the application, without exposing secrets. */
export function parseEnvironment(
  environment: Readonly<Record<string, string | undefined>>,
): AppConfiguration {
  const rawPort = environment.PORT ?? '3000';
  const port = Number(rawPort);
  if (
    !/^\d+$/.test(rawPort) ||
    !Number.isInteger(port) ||
    port < 1 ||
    port > 65535
  ) {
    throw new Error('PORT must be an integer between 1 and 65535.');
  }

  const url = environment.DATABASE_URL?.trim();
  if (!url)
    throw new Error('DATABASE_URL is required. See backend/.env.example.');
  let connection: URL;
  try {
    connection = new URL(url);
  } catch {
    throw new Error('DATABASE_URL must be a valid PostgreSQL connection URL.');
  }
  if (
    !['postgres:', 'postgresql:'].includes(connection.protocol) ||
    !connection.hostname ||
    connection.pathname.length < 2
  ) {
    throw new Error(
      'DATABASE_URL must specify a PostgreSQL host and database.',
    );
  }

  const projectUrl =
    environment.SUPABASE_URL?.trim().replace(/\/$/, '') || null;
  if (projectUrl) {
    try {
      const parsed = new URL(projectUrl);
      if (
        parsed.protocol !== 'https:' ||
        parsed.pathname !== '/' ||
        parsed.search ||
        parsed.hash ||
        parsed.username ||
        parsed.password
      )
        throw new Error();
    } catch {
      throw new Error('SUPABASE_URL must be an HTTPS project origin.');
    }
  }
  const origins = (environment.CORS_ORIGINS ?? 'http://localhost:4200')
    .split(',')
    .map((value) => value.trim());
  for (const origin of origins) {
    try {
      const parsed = new URL(origin);
      if (
        !['http:', 'https:'].includes(parsed.protocol) ||
        parsed.origin !== origin
      )
        throw new Error();
    } catch {
      throw new Error(
        'CORS_ORIGINS must contain explicit HTTP origins separated by commas.',
      );
    }
  }
  const serviceRoleKey = environment.SUPABASE_SERVICE_ROLE_KEY?.trim() || null;
  if (serviceRoleKey && !projectUrl) {
    throw new Error(
      'SUPABASE_URL is required when SUPABASE_SERVICE_ROLE_KEY is configured.',
    );
  }
  return {
    port,
    database: { url },
    auth: { projectUrl, serviceRoleKey },
    cors: { origins },
  };
}

/** The only boundary that reads process.env; shared by Nest and the database CLI. */
export function loadConfiguration(): AppConfiguration {
  config({ quiet: true });
  return parseEnvironment(process.env);
}
