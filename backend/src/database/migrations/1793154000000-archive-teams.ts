import type { MigrationInterface, QueryRunner } from 'typeorm';

export class ArchiveTeams1793154000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE public.team ADD COLUMN archived_at timestamptz;
      DROP INDEX public.team_name_normalized_unique;
      CREATE UNIQUE INDEX team_name_normalized_unique ON public.team(lower(btrim(name))) WHERE archived_at IS NULL;
      CREATE FUNCTION public.require_available_league_team() RETURNS trigger LANGUAGE plpgsql AS $$
      DECLARE archived timestamptz;
      BEGIN
        SELECT archived_at INTO archived FROM public.team WHERE id=NEW.team_id FOR UPDATE;
        IF NOT FOUND OR archived IS NOT NULL THEN
          RAISE EXCEPTION 'Team is unavailable' USING ERRCODE = '23514';
        END IF;
        RETURN NEW;
      END $$;
      CREATE TRIGGER league_team_available BEFORE INSERT ON public.league_team
        FOR EACH ROW EXECUTE FUNCTION public.require_available_league_team();
    `);
  }
  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TRIGGER league_team_available ON public.league_team;
      DROP FUNCTION public.require_available_league_team();
      DROP INDEX public.team_name_normalized_unique;
      CREATE UNIQUE INDEX team_name_normalized_unique ON public.team(lower(btrim(name)));
      ALTER TABLE public.team DROP COLUMN archived_at;
    `);
  }
}
