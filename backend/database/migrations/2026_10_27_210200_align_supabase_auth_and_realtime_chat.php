<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Alinha o perfil à identidade do Supabase Auth e move o chat legado para
     * arquivo. A aplicação usa canais privados do Supabase Realtime para chat.
     */
    public function up(): void
    {
        // O trigger do Auth é administrado fora desta migration. Não inferimos
        // sua implementação consultando pg_proc; damos ao papel interno do Auth
        // acesso de INSERT limitado por RLS e pela FK para auth.users.
        DB::statement('CREATE SCHEMA IF NOT EXISTS legacy');
        DB::unprepared(<<<'SQL'
DO $$
DECLARE
    fk RECORD;
    local_columns TEXT;
    referenced_columns TEXT;
    delete_action TEXT;
    update_action TEXT;
    deferred_clause TEXT;
BEGIN
    IF to_regclass('public."user"') IS NOT NULL AND to_regclass('public.users') IS NULL THEN
        ALTER TABLE public."user" RENAME TO users;
    ELSIF to_regclass('public."user"') IS NOT NULL AND to_regclass('public.users') IS NOT NULL THEN
        -- Em alguns projetos o perfil já existe por causa do trigger do Auth,
        -- enquanto a migration antiga também criou public.user. Consolida sem
        -- sobrescrever dados que o trigger já gravou.
        ALTER TABLE public.users ADD COLUMN IF NOT EXISTS name VARCHAR(150);
        ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email VARCHAR(150);
        ALTER TABLE public.users ADD COLUMN IF NOT EXISTS username VARCHAR(45);
        ALTER TABLE public.users ADD COLUMN IF NOT EXISTS dt_birth DATE;
        ALTER TABLE public.users ADD COLUMN IF NOT EXISTS gender CHAR(1);
        ALTER TABLE public.users ADD COLUMN IF NOT EXISTS image VARCHAR(150);
        ALTER TABLE public.users ADD COLUMN IF NOT EXISTS permission_id BIGINT;
        ALTER TABLE public.users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP;

        INSERT INTO public.users AS current_profile
            (id, name, email, username, dt_birth, gender, image, permission_id, created_at)
        SELECT id, name, email, username, dt_birth, gender, image, permission_id, created_at
        FROM public."user"
        ON CONFLICT (id) DO UPDATE SET
            name = COALESCE(current_profile.name, EXCLUDED.name),
            email = COALESCE(current_profile.email, EXCLUDED.email),
            username = COALESCE(current_profile.username, EXCLUDED.username),
            dt_birth = COALESCE(current_profile.dt_birth, EXCLUDED.dt_birth),
            gender = COALESCE(current_profile.gender, EXCLUDED.gender),
            image = COALESCE(current_profile.image, EXCLUDED.image),
            permission_id = COALESCE(current_profile.permission_id, EXCLUDED.permission_id);

        FOR fk IN
            SELECT conname, conrelid, conkey, confkey, confdeltype, confupdtype, condeferrable, condeferred
            FROM pg_constraint
            WHERE contype = 'f' AND confrelid = 'public."user"'::regclass
        LOOP
            SELECT string_agg(quote_ident(attribute.attname), ', ' ORDER BY key.ordinality)
            INTO local_columns
            FROM unnest(fk.conkey) WITH ORDINALITY AS key(attnum, ordinality)
            JOIN pg_attribute AS attribute ON attribute.attrelid = fk.conrelid AND attribute.attnum = key.attnum;

            SELECT string_agg(quote_ident(attribute.attname), ', ' ORDER BY key.ordinality)
            INTO referenced_columns
            FROM unnest(fk.confkey) WITH ORDINALITY AS key(attnum, ordinality)
            JOIN pg_attribute AS attribute ON attribute.attrelid = 'public."user"'::regclass AND attribute.attnum = key.attnum;

            delete_action := CASE fk.confdeltype WHEN 'c' THEN 'CASCADE' WHEN 'n' THEN 'SET NULL' WHEN 'd' THEN 'SET DEFAULT' WHEN 'r' THEN 'RESTRICT' ELSE 'NO ACTION' END;
            update_action := CASE fk.confupdtype WHEN 'c' THEN 'CASCADE' WHEN 'n' THEN 'SET NULL' WHEN 'd' THEN 'SET DEFAULT' WHEN 'r' THEN 'RESTRICT' ELSE 'NO ACTION' END;
            deferred_clause := CASE WHEN fk.condeferrable THEN CASE WHEN fk.condeferred THEN ' DEFERRABLE INITIALLY DEFERRED' ELSE ' DEFERRABLE INITIALLY IMMEDIATE' END ELSE '' END;

            EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I', fk.conrelid::regclass, fk.conname);
            EXECUTE format(
                'ALTER TABLE %s ADD CONSTRAINT %I FOREIGN KEY (%s) REFERENCES public.users (%s) ON DELETE %s ON UPDATE %s%s',
                fk.conrelid::regclass, fk.conname, local_columns, referenced_columns, delete_action, update_action, deferred_clause
            );
        END LOOP;

        DROP TABLE public."user";
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'public.users'::regclass
          AND confrelid = 'auth.users'::regclass
          AND contype = 'f'
    ) THEN
        ALTER TABLE public.users ADD CONSTRAINT users_id_auth_users_foreign
            FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;

    IF to_regclass('public.chat') IS NOT NULL THEN
        CREATE SCHEMA IF NOT EXISTS legacy;
        ALTER TABLE public.chat SET SCHEMA legacy;
    END IF;
    IF to_regclass('public.message') IS NOT NULL THEN
        CREATE SCHEMA IF NOT EXISTS legacy;
        ALTER TABLE public.message SET SCHEMA legacy;
    END IF;
    IF to_regclass('public.user_chat') IS NOT NULL THEN
        CREATE SCHEMA IF NOT EXISTS legacy;
        ALTER TABLE public.user_chat SET SCHEMA legacy;
    END IF;

    IF to_regclass('public.team') IS NOT NULL
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'team' AND column_name = 'chat_id') THEN
        ALTER TABLE public.team RENAME COLUMN chat_id TO legacy_chat_id;
    END IF;
END
$$;
SQL);

        // A trigger de auth.users precisa conseguir criar o perfil sem depender
        // de metadados do Google nem de um seeder de permissões executado antes.
        DB::statement('ALTER TABLE public.users ALTER COLUMN name DROP NOT NULL');
        DB::statement('ALTER TABLE public.users ALTER COLUMN email DROP NOT NULL');
        DB::statement('ALTER TABLE public.users ALTER COLUMN permission_id DROP DEFAULT');
        DB::statement('ALTER TABLE public.users ALTER COLUMN permission_id DROP NOT NULL');
        DB::statement('ALTER TABLE public.users DROP CONSTRAINT IF EXISTS user_permission_id_foreign');
        DB::statement('ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_permission_id_foreign');
        DB::statement('ALTER TABLE public.users ADD CONSTRAINT users_permission_id_foreign FOREIGN KEY (permission_id) REFERENCES public.permission(id) ON DELETE SET NULL');

        DB::statement('ALTER TABLE public.users ENABLE ROW LEVEL SECURITY');
        DB::statement('DROP POLICY IF EXISTS users_read_own_profile ON public.users');
        DB::statement('DROP POLICY IF EXISTS users_update_own_profile ON public.users');
        DB::statement('CREATE POLICY users_read_own_profile ON public.users FOR SELECT TO authenticated USING ((SELECT auth.uid()) = id)');
        DB::statement('CREATE POLICY users_update_own_profile ON public.users FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = id) WITH CHECK ((SELECT auth.uid()) = id)');
        DB::statement('REVOKE ALL ON TABLE public.users FROM anon, authenticated');
        DB::statement('GRANT SELECT ON TABLE public.users TO authenticated');
        DB::statement('GRANT UPDATE (name, username, dt_birth, gender, image) ON TABLE public.users TO authenticated');
        DB::statement('GRANT USAGE ON SCHEMA public TO supabase_auth_admin');
        DB::statement('GRANT INSERT ON TABLE public.users TO supabase_auth_admin');
        DB::statement('DROP POLICY IF EXISTS users_auth_profile_insert ON public.users');
        DB::statement('CREATE POLICY users_auth_profile_insert ON public.users FOR INSERT TO supabase_auth_admin WITH CHECK (true)');

        foreach ([
            'friend',
            'user_team',
            'user_appointment',
            'appointment',
        ] as $table) {
            DB::statement('ALTER TABLE public.' . $table . ' ENABLE ROW LEVEL SECURITY');
        }
        DB::statement('REVOKE ALL ON TABLE public.friend, public.user_team, public.user_appointment, public.appointment FROM anon');
        DB::statement('GRANT SELECT ON TABLE public.friend, public.user_team, public.user_appointment, public.appointment TO authenticated');
        DB::statement('DROP POLICY IF EXISTS friend_read_own_relationships ON public.friend');
        DB::statement('CREATE POLICY friend_read_own_relationships ON public.friend FOR SELECT TO authenticated USING (requester_id = (SELECT auth.uid()) OR addressee_id = (SELECT auth.uid()))');
        DB::statement('DROP POLICY IF EXISTS user_team_read_own_memberships ON public.user_team');
        DB::statement('CREATE POLICY user_team_read_own_memberships ON public.user_team FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()))');
        DB::statement('DROP POLICY IF EXISTS user_appointment_read_own_memberships ON public.user_appointment');
        DB::statement('CREATE POLICY user_appointment_read_own_memberships ON public.user_appointment FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()))');
        DB::statement('DROP POLICY IF EXISTS appointment_read_own_contexts ON public.appointment');
        DB::statement('CREATE POLICY appointment_read_own_contexts ON public.appointment FOR SELECT TO authenticated USING (organizer_id = (SELECT auth.uid()) OR EXISTS (SELECT 1 FROM public.user_appointment AS participant WHERE participant.appointment_id = appointment.id AND participant.user_id = (SELECT auth.uid())))');

        // As mensagens são efêmeras e não são gravadas nas tabelas public.*.
        // A autorização é feita por contexto de domínio e membership.
        DB::statement('REVOKE ALL ON SCHEMA legacy FROM anon, authenticated');
        DB::statement('REVOKE ALL ON ALL TABLES IN SCHEMA legacy FROM anon, authenticated');
        foreach ([
            'realtime_team_chat_read',
            'realtime_team_chat_send',
            'realtime_appointment_chat_read',
            'realtime_appointment_chat_send',
            'realtime_direct_chat_read',
            'realtime_direct_chat_send',
        ] as $policy) {
            DB::statement('DROP POLICY IF EXISTS ' . $policy . ' ON realtime.messages');
        }

        DB::unprepared(<<<'SQL'
CREATE POLICY realtime_team_chat_read ON realtime.messages
FOR SELECT TO authenticated
USING (
    realtime.messages.extension IN ('broadcast', 'presence')
    AND split_part(realtime.topic(), ':', 1) = 'team'
    AND EXISTS (
        SELECT 1 FROM public.user_team AS membership
        WHERE membership.team_id::text = split_part(realtime.topic(), ':', 2)
          AND membership.user_id = (SELECT auth.uid())
    )
);
CREATE POLICY realtime_team_chat_send ON realtime.messages
FOR INSERT TO authenticated
WITH CHECK (
    realtime.messages.extension IN ('broadcast', 'presence')
    AND split_part(realtime.topic(), ':', 1) = 'team'
    AND EXISTS (
        SELECT 1 FROM public.user_team AS membership
        WHERE membership.team_id::text = split_part(realtime.topic(), ':', 2)
          AND membership.user_id = (SELECT auth.uid())
    )
);
CREATE POLICY realtime_appointment_chat_read ON realtime.messages
FOR SELECT TO authenticated
USING (
    realtime.messages.extension IN ('broadcast', 'presence')
    AND split_part(realtime.topic(), ':', 1) = 'appointment'
    AND EXISTS (
        SELECT 1 FROM public.appointment AS appointment
        WHERE appointment.id::text = split_part(realtime.topic(), ':', 2)
          AND (
              appointment.organizer_id = (SELECT auth.uid())
              OR EXISTS (
                  SELECT 1 FROM public.user_appointment AS participant
                  WHERE participant.appointment_id = appointment.id
                    AND participant.user_id = (SELECT auth.uid())
              )
          )
    )
);
CREATE POLICY realtime_appointment_chat_send ON realtime.messages
FOR INSERT TO authenticated
WITH CHECK (
    realtime.messages.extension IN ('broadcast', 'presence')
    AND split_part(realtime.topic(), ':', 1) = 'appointment'
    AND EXISTS (
        SELECT 1 FROM public.appointment AS appointment
        WHERE appointment.id::text = split_part(realtime.topic(), ':', 2)
          AND (
              appointment.organizer_id = (SELECT auth.uid())
              OR EXISTS (
                  SELECT 1 FROM public.user_appointment AS participant
                  WHERE participant.appointment_id = appointment.id
                    AND participant.user_id = (SELECT auth.uid())
              )
          )
    )
);
CREATE POLICY realtime_direct_chat_read ON realtime.messages
FOR SELECT TO authenticated
USING (
    realtime.messages.extension IN ('broadcast', 'presence')
    AND split_part(realtime.topic(), ':', 1) = 'direct'
    AND split_part(realtime.topic(), ':', 2) < split_part(realtime.topic(), ':', 3)
    AND EXISTS (
        SELECT 1 FROM public.friend AS friendship
        WHERE friendship.status = 'accepted'
          AND (
              (friendship.requester_id::text = split_part(realtime.topic(), ':', 2)
               AND friendship.addressee_id::text = split_part(realtime.topic(), ':', 3))
              OR
              (friendship.addressee_id::text = split_part(realtime.topic(), ':', 2)
               AND friendship.requester_id::text = split_part(realtime.topic(), ':', 3))
          )
          AND (friendship.requester_id = (SELECT auth.uid()) OR friendship.addressee_id = (SELECT auth.uid()))
    )
);
CREATE POLICY realtime_direct_chat_send ON realtime.messages
FOR INSERT TO authenticated
WITH CHECK (
    realtime.messages.extension IN ('broadcast', 'presence')
    AND split_part(realtime.topic(), ':', 1) = 'direct'
    AND split_part(realtime.topic(), ':', 2) < split_part(realtime.topic(), ':', 3)
    AND EXISTS (
        SELECT 1 FROM public.friend AS friendship
        WHERE friendship.status = 'accepted'
          AND (
              (friendship.requester_id::text = split_part(realtime.topic(), ':', 2)
               AND friendship.addressee_id::text = split_part(realtime.topic(), ':', 3))
              OR
              (friendship.addressee_id::text = split_part(realtime.topic(), ':', 2)
               AND friendship.requester_id::text = split_part(realtime.topic(), ':', 3))
          )
          AND (friendship.requester_id = (SELECT auth.uid()) OR friendship.addressee_id = (SELECT auth.uid()))
    )
);
SQL);

        DB::statement("COMMENT ON TABLE public.users IS 'Perfil da aplicação vinculado um-para-um ao usuário de auth.users do Supabase.'");
        if (DB::selectOne("SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'team' AND column_name = 'legacy_chat_id') AS exists")->exists) {
            DB::statement("COMMENT ON COLUMN public.team.legacy_chat_id IS 'Identificador de chat legado preservado no schema legacy durante a migração para Supabase Realtime.'");
        }
        DB::statement("COMMENT ON COLUMN public.users.id IS 'Mesmo UUID de auth.users.id; identidade autenticada pelo Supabase.'");
        DB::statement("COMMENT ON COLUMN public.users.permission_id IS 'Papel opcional da aplicação; a criação de perfil pelo trigger não depende de seeders.'");
    }

    /**
     * A reversão automática não é segura: o trigger existente em auth.users
     * referencia public.users e pode haver mensagens arquivadas no schema legacy.
     */
    public function down(): void
    {
        throw new RuntimeException('Migration de arquitetura Supabase é forward-only; reverta o trigger de auth.users e migre os dados manualmente antes de restaurar o esquema anterior.');
    }
};
