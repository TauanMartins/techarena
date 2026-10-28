import { readFile } from 'node:fs/promises';
import type { MigrationInterface, QueryRunner } from 'typeorm';

/** Describe local user profiles without assuming an external identity provider. */
export class LocalProfileDocumentation1793145720000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      COMMENT ON TABLE public.users IS 'Perfil do usuário da aplicação.';
      COMMENT ON COLUMN public.users.id IS 'Identificador UUID do usuário.';
      COMMENT ON COLUMN public.users.name IS 'Nome exibido do usuário.';
      COMMENT ON COLUMN public.users.email IS 'Endereço de e-mail do usuário.';
      COMMENT ON COLUMN public.users.image IS 'URL da foto de perfil do usuário.';
      COMMENT ON COLUMN public.users.permission_id IS 'Permissão opcional atribuída ao usuário.';
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      await readFile(
        new URL('../../../database/sql/schema-comments.sql', import.meta.url),
        'utf8',
      ),
    );
  }
}
