<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Regras de integridade adicionais para relacionamentos e resultados.
     * PostgreSQL é o banco de produção (a extensão PostGIS já é requisito do projeto).
     */
    public function up(): void
    {
        Schema::rename('prefered_sports', 'user_sport');
        DB::statement("COMMENT ON TABLE user_sport IS 'Esportes preferidos associados a cada usuário.'");
        DB::statement("COMMENT ON COLUMN user_sport.user_id IS 'Usuário que declarou a preferência pelo esporte.'");
        DB::statement("COMMENT ON COLUMN user_sport.sport_id IS 'Esporte preferido pelo usuário.'");
        $selfRelationships = DB::selectOne('SELECT COUNT(*) AS total FROM friend WHERE requester_id = addressee_id');
        if ((int) $selfRelationships->total > 0) {
            throw new \RuntimeException('Existem amizades de um usuário consigo mesmo; corrija esses registros antes de aplicar a migration.');
        }
        DB::statement('ALTER TABLE friend ADD CONSTRAINT friend_no_self_relationship CHECK (requester_id <> addressee_id)');

        // Falha com diagnóstico claro em vez de apagar registros históricos silenciosamente.
        $duplicatePairs = DB::selectOne('SELECT COUNT(*) AS total FROM (SELECT LEAST(requester_id, addressee_id), GREATEST(requester_id, addressee_id) FROM friend GROUP BY 1, 2 HAVING COUNT(*) > 1) AS duplicate_pairs');
        if ((int) $duplicatePairs->total > 0) {
            throw new \RuntimeException('Existem amizades duplicadas em sentidos opostos; consolide esses pares antes de aplicar a migration.');
        }

        // Impede duplicatas do mesmo par independentemente de quem iniciou o convite.
        DB::statement('CREATE UNIQUE INDEX friend_unique_unordered_pair ON friend (LEAST(requester_id, addressee_id), GREATEST(requester_id, addressee_id))');

        $duplicateResults = DB::selectOne('SELECT COUNT(*) AS total FROM (SELECT appointment_id FROM appointment_result GROUP BY appointment_id HAVING COUNT(*) > 1) AS duplicate_results');
        if ((int) $duplicateResults->total > 0) {
            throw new \RuntimeException('Existem múltiplos resultados para um agendamento; consolide-os antes de aplicar a migration.');
        }

        Schema::table('appointment_result', function ($table): void {
            $table->unique('appointment_id', 'appointment_result_one_per_appointment');
        });

        DB::statement('ALTER TABLE appointment_result ADD CONSTRAINT appointment_result_scores_non_negative CHECK ((winner_score IS NULL OR winner_score >= 0) AND (loser_score IS NULL OR loser_score >= 0))');
        DB::statement('ALTER TABLE appointment_result ADD CONSTRAINT appointment_result_different_teams CHECK (winner_team_id IS NULL OR loser_team_id IS NULL OR winner_team_id <> loser_team_id)');
        DB::statement('ALTER TABLE appointment_result ADD CONSTRAINT appointment_result_team_pair CHECK ((winner_team_id IS NULL) = (loser_team_id IS NULL))');
        DB::statement('ALTER TABLE appointment_result ADD CONSTRAINT appointment_result_score_pair CHECK ((winner_score IS NULL) = (loser_score IS NULL))');

        // Índices para consultas que partem do lado não líder das chaves compostas.
        Schema::table('friend', function ($table): void {
            $table->index('requester_id', 'friend_requester_id_index');
            $table->index('addressee_id', 'friend_addressee_id_index');
        });
        Schema::table('appointment', fn ($table) => $table->index('organizer_id', 'appointment_organizer_id_index'));
        Schema::table('appointment_result', function ($table): void {
            $table->index('winner_team_id', 'appointment_result_winner_team_id_index');
            $table->index('loser_team_id', 'appointment_result_loser_team_id_index');
        });
        Schema::table('user_preference', fn ($table) => $table->index('preference_id', 'user_preference_preference_id_index'));
        Schema::table('user_sport', fn ($table) => $table->index('sport_id', 'user_sport_sport_id_index'));
        Schema::table('user_appointment', fn ($table) => $table->index('user_id', 'user_appointment_user_id_index'));
        Schema::table('league_team', fn ($table) => $table->index('league_id', 'league_team_league_id_index'));
        Schema::table('sport_material', fn ($table) => $table->index('material_id', 'sport_material_material_id_index'));
        Schema::table('sport_arena', fn ($table) => $table->index('arena_id', 'sport_arena_arena_id_index'));
        Schema::table('user_team', fn ($table) => $table->index('team_id', 'user_team_team_id_index'));
    }

    public function down(): void
    {
        Schema::table('user_team', fn ($table) => $table->dropIndex('user_team_team_id_index'));
        Schema::table('sport_arena', fn ($table) => $table->dropIndex('sport_arena_arena_id_index'));
        Schema::table('sport_material', fn ($table) => $table->dropIndex('sport_material_material_id_index'));
        Schema::table('league_team', fn ($table) => $table->dropIndex('league_team_league_id_index'));
        Schema::table('user_appointment', fn ($table) => $table->dropIndex('user_appointment_user_id_index'));
        Schema::table('user_sport', fn ($table) => $table->dropIndex('user_sport_sport_id_index'));
        Schema::table('user_preference', fn ($table) => $table->dropIndex('user_preference_preference_id_index'));
        Schema::table('appointment_result', function ($table): void {
            $table->dropIndex('appointment_result_loser_team_id_index');
            $table->dropIndex('appointment_result_winner_team_id_index');
        });
        Schema::table('appointment', fn ($table) => $table->dropIndex('appointment_organizer_id_index'));
        Schema::table('friend', function ($table): void {
            $table->dropIndex('friend_addressee_id_index');
            $table->dropIndex('friend_requester_id_index');
        });

        Schema::table('appointment_result', function ($table): void {
            $table->dropUnique('appointment_result_one_per_appointment');
        });

        DB::statement('ALTER TABLE appointment_result DROP CONSTRAINT IF EXISTS appointment_result_score_pair');
        DB::statement('ALTER TABLE appointment_result DROP CONSTRAINT IF EXISTS appointment_result_team_pair');
        DB::statement('ALTER TABLE appointment_result DROP CONSTRAINT IF EXISTS appointment_result_different_teams');
        DB::statement('ALTER TABLE appointment_result DROP CONSTRAINT IF EXISTS appointment_result_scores_non_negative');
        DB::statement('DROP INDEX IF EXISTS friend_unique_unordered_pair');
        DB::statement('ALTER TABLE friend DROP CONSTRAINT IF EXISTS friend_no_self_relationship');
        Schema::rename('user_sport', 'prefered_sports');
        DB::statement("COMMENT ON TABLE prefered_sports IS NULL");
        DB::statement("COMMENT ON COLUMN prefered_sports.user_id IS 'ID do usuário.'");
        DB::statement("COMMENT ON COLUMN prefered_sports.sport_id IS 'ID do esporte.'");
    }
};
