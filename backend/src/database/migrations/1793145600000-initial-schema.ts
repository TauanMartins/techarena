import { readFile } from 'node:fs/promises';
import type { MigrationInterface, QueryRunner } from 'typeorm';

/** Snapshot of the final Laravel schema, including PostgreSQL comments. */
export class InitialSchema1793145600000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      await readFile(
        new URL('../../../database/sql/initial-schema.sql', import.meta.url),
        'utf8',
      ),
    );
    await queryRunner.query(
      await readFile(
        new URL('../../../database/sql/schema-comments.sql', import.meta.url),
        'utf8',
      ),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    // Reverse dependency order. Shared extensions and schemas remain installed.
    for (const table of [
      'appointment_result',
      'user_team',
      'league_team',
      'team',
      'user_sport',
      'user_appointment',
      'appointment',
      'league',
      'schedule',
      'sport_arena',
      'arena',
      'sport_material',
      'material',
      'sport',
      'user_preference',
      'preference',
      'friend',
      'users',
      'permission',
    ]) {
      await queryRunner.query(`DROP TABLE public."${table}"`);
    }
  }
}
