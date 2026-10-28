import type { DataSource } from 'typeorm';

/** Read-only check against the database used by this process, never a fallback URL. */
export async function assertDatabaseReady(source: DataSource): Promise<void> {
  if (await source.showMigrations()) {
    throw new Error(
      'Database has pending migrations. Run npm run db:migrate with the same DATABASE_URL as the API before starting it.',
    );
  }

  // Migration history alone does not detect manually removed/renamed columns.
  // LIMIT 0 asks PostgreSQL to resolve every mapped column without reading rows.
  const quote = (name: string) => source.driver.escape(name);
  for (const entity of source.entityMetadatas) {
    const table = [entity.schema, entity.tableName]
      .filter((name): name is string => name !== undefined)
      .map(quote)
      .join('.');
    const columns = entity.columns
      .map((column) => quote(column.databaseName))
      .join(', ');
    try {
      await source.query(`SELECT ${columns} FROM ${table} LIMIT 0`);
    } catch (cause) {
      throw new Error(
        `Database schema does not match entity ${entity.name} (${table}). Check migrations and DATABASE_URL.`,
        { cause },
      );
    }
  }
}
