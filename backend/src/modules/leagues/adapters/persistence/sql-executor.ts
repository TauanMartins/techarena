/** Infrastructure-only SQL boundary. Never imported by application or domain. */
export interface SqlExecutor {
  query<T>(sql: string, parameters: unknown[]): Promise<T>;
}
