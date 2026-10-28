import { config } from 'dotenv';

export interface AppConfiguration {
  readonly port: number;
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

  return { port, database: { url } };
}

/** The only boundary that reads process.env; shared by Nest and the database CLI. */
export function loadConfiguration(): AppConfiguration {
  config({ quiet: true });
  return parseEnvironment(process.env);
}
