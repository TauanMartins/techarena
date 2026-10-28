import type { MigrationInterface, QueryRunner } from 'typeorm';

/** PostgreSQL aliases CURRENT_TIMESTAMP and now(); use TypeORM's canonical form. */
export class NormalizeTimestampDefaults1793145601000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE public.users ALTER COLUMN created_at SET DEFAULT now()',
    );
    await queryRunner.query(
      'ALTER TABLE public.team ALTER COLUMN created_at SET DEFAULT now()',
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE public.users ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP',
    );
    await queryRunner.query(
      'ALTER TABLE public.team ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP',
    );
  }
}
