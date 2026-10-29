import type { MigrationInterface, QueryRunner } from 'typeorm';

export class ManageLeagueTournaments1793152000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE public.league
        ADD COLUMN IF NOT EXISTS tournament_format varchar(24) NOT NULL DEFAULT 'round_robin',
        ADD COLUMN IF NOT EXISTS status varchar(16) NOT NULL DEFAULT 'open',
        ADD COLUMN IF NOT EXISTS group_count integer NOT NULL DEFAULT 2,
        ADD COLUMN IF NOT EXISTS qualifiers_per_group integer NOT NULL DEFAULT 2;
      ALTER TABLE public.league_match
        ADD COLUMN IF NOT EXISTS phase varchar(16) NOT NULL DEFAULT 'manual',
        ADD COLUMN IF NOT EXISTS round_number integer NOT NULL DEFAULT 1,
        ADD COLUMN IF NOT EXISTS group_number integer;
      ALTER TABLE public.league_team
        ADD COLUMN IF NOT EXISTS group_number integer;
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conrelid='public.league'::regclass
            AND conname='league_tournament_format_check'
        ) THEN
          ALTER TABLE public.league ADD CONSTRAINT league_tournament_format_check
            CHECK (tournament_format IN ('round_robin', 'knockout', 'groups_knockout'));
        END IF;
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conrelid='public.league'::regclass
            AND conname='league_tournament_status_check'
        ) THEN
          ALTER TABLE public.league ADD CONSTRAINT league_tournament_status_check
            CHECK (status IN ('open', 'active', 'completed', 'canceled'));
        END IF;
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conrelid='public.league'::regclass
            AND conname='league_group_count_check'
        ) THEN
          ALTER TABLE public.league ADD CONSTRAINT league_group_count_check
            CHECK (group_count BETWEEN 2 AND 16);
        END IF;
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conrelid='public.league'::regclass
            AND conname='league_qualifiers_per_group_check'
        ) THEN
          ALTER TABLE public.league ADD CONSTRAINT league_qualifiers_per_group_check
            CHECK (qualifiers_per_group BETWEEN 1 AND 8);
        END IF;
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conrelid='public.league_match'::regclass
            AND conname='league_match_phase_check'
        ) THEN
          ALTER TABLE public.league_match ADD CONSTRAINT league_match_phase_check
            CHECK (phase IN ('manual', 'group', 'knockout'));
        END IF;
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conrelid='public.league_match'::regclass
            AND conname='league_match_round_number_check'
        ) THEN
          ALTER TABLE public.league_match ADD CONSTRAINT league_match_round_number_check
            CHECK (round_number > 0);
        END IF;
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conrelid='public.league_match'::regclass
            AND conname='league_match_group_number_check'
        ) THEN
          ALTER TABLE public.league_match ADD CONSTRAINT league_match_group_number_check
            CHECK (group_number IS NULL OR group_number > 0);
        END IF;
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conrelid='public.league_team'::regclass
            AND conname='league_team_group_number_check'
        ) THEN
          ALTER TABLE public.league_team ADD CONSTRAINT league_team_group_number_check
            CHECK (group_number IS NULL OR group_number > 0);
        END IF;
      END $$;
      CREATE INDEX IF NOT EXISTS league_match_stage_index
        ON public.league_match(league_id, phase, group_number, round_number);
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS public.league_match_stage_index;
      ALTER TABLE public.league_team
        DROP CONSTRAINT IF EXISTS league_team_group_number_check;
      ALTER TABLE public.league_team DROP COLUMN IF EXISTS group_number;
      ALTER TABLE public.league_match
        DROP CONSTRAINT IF EXISTS league_match_group_number_check,
        DROP CONSTRAINT IF EXISTS league_match_round_number_check,
        DROP CONSTRAINT IF EXISTS league_match_phase_check,
        DROP COLUMN IF EXISTS group_number,
        DROP COLUMN IF EXISTS round_number,
        DROP COLUMN IF EXISTS phase;
      ALTER TABLE public.league
        DROP CONSTRAINT IF EXISTS league_qualifiers_per_group_check,
        DROP CONSTRAINT IF EXISTS league_group_count_check,
        DROP CONSTRAINT IF EXISTS league_tournament_status_check,
        DROP CONSTRAINT IF EXISTS league_tournament_format_check,
        DROP COLUMN IF EXISTS qualifiers_per_group,
        DROP COLUMN IF EXISTS group_count,
        DROP COLUMN IF EXISTS status,
        DROP COLUMN IF EXISTS tournament_format;
    `);
  }
}
