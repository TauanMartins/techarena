<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /** Atualiza os comentários de colunas em bancos que já aplicaram as migrations anteriores. */
    public function up(): void
    {
        $pdo = DB::connection()->getPdo();
        DB::statement("COMMENT ON COLUMN appointment.created_at IS " . $pdo->quote('Data e hora de criação do registro.')); 
        DB::statement("COMMENT ON COLUMN appointment.deleted_at IS " . $pdo->quote('Data e hora da exclusão lógica do registro.')); 
        DB::statement("COMMENT ON COLUMN appointment.description IS " . $pdo->quote('Descrição de appointment.')); 
        DB::statement("COMMENT ON COLUMN appointment.id IS " . $pdo->quote('Identificador único do registro da tabela appointment.')); 
        DB::statement("COMMENT ON COLUMN appointment.location IS " . $pdo->quote('Localização geográfica de appointment.')); 
        DB::statement("COMMENT ON COLUMN appointment.max_players IS " . $pdo->quote('Limite de participantes de appointment.')); 
        DB::statement("COMMENT ON COLUMN appointment.organizer_id IS " . $pdo->quote('Referência a identificador do usuário organizador relacionada à tabela appointment.')); 
        DB::statement("COMMENT ON COLUMN appointment.scheduled_at IS " . $pdo->quote('Data e hora agendadas de appointment.')); 
        DB::statement("COMMENT ON COLUMN appointment.status IS " . $pdo->quote('Estado atual do registro de appointment.')); 
        DB::statement("COMMENT ON COLUMN appointment.title IS " . $pdo->quote('Título de appointment.')); 
        DB::statement("COMMENT ON COLUMN appointment.updated_at IS " . $pdo->quote('Data e hora da última atualização do registro.')); 
        DB::statement("COMMENT ON COLUMN appointment_result.appointment_id IS " . $pdo->quote('Referência a identificador do agendamento relacionada à tabela appointment_result.')); 
        DB::statement("COMMENT ON COLUMN appointment_result.created_at IS " . $pdo->quote('Data e hora de criação do registro.')); 
        DB::statement("COMMENT ON COLUMN appointment_result.id IS " . $pdo->quote('Identificador único do registro da tabela appointment_result.')); 
        DB::statement("COMMENT ON COLUMN appointment_result.loser_score IS " . $pdo->quote('Pontuação do perdedor de appointment_result.')); 
        DB::statement("COMMENT ON COLUMN appointment_result.loser_team_id IS " . $pdo->quote('Referência a identificador do time perdedor relacionada à tabela appointment_result.')); 
        DB::statement("COMMENT ON COLUMN appointment_result.notes IS " . $pdo->quote('Observações de appointment_result.')); 
        DB::statement("COMMENT ON COLUMN appointment_result.updated_at IS " . $pdo->quote('Data e hora da última atualização do registro.')); 
        DB::statement("COMMENT ON COLUMN appointment_result.winner_score IS " . $pdo->quote('Pontuação do vencedor de appointment_result.')); 
        DB::statement("COMMENT ON COLUMN appointment_result.winner_team_id IS " . $pdo->quote('Referência a identificador do time vencedor relacionada à tabela appointment_result.')); 
        DB::statement("COMMENT ON COLUMN friend.addressee_id IS " . $pdo->quote('Referência a usuário que recebeu a solicitação relacionada à tabela friend.')); 
        DB::statement("COMMENT ON COLUMN friend.created_at IS " . $pdo->quote('Data e hora de criação do registro.')); 
        DB::statement("COMMENT ON COLUMN friend.id IS " . $pdo->quote('Identificador único do registro da tabela friend.')); 
        DB::statement("COMMENT ON COLUMN friend.requester_id IS " . $pdo->quote('Referência a usuário que enviou a solicitação relacionada à tabela friend.')); 
        DB::statement("COMMENT ON COLUMN friend.status IS " . $pdo->quote('Estado atual do registro de friend.')); 
        DB::statement("COMMENT ON COLUMN friend.updated_at IS " . $pdo->quote('Data e hora da última atualização do registro.')); 
        DB::statement("COMMENT ON COLUMN league_team.league_id IS " . $pdo->quote('Referência a league id relacionada à tabela league_team.')); 
        DB::statement("COMMENT ON COLUMN league_team.team_id IS " . $pdo->quote('Referência a identificador do time relacionada à tabela league_team.')); 
        DB::statement("COMMENT ON COLUMN users.created_at IS " . $pdo->quote('Data e hora de criação de user.')); 
        DB::statement("COMMENT ON COLUMN users.permission_id IS " . $pdo->quote('Referência a identificador da permissão relacionada à tabela user.')); 
        if (DB::selectOne("SELECT to_regclass('public.user_chat') AS relation")->relation !== null) {
            DB::statement("COMMENT ON COLUMN user_chat.created_at IS " . $pdo->quote('Data e hora de criação do registro.'));
            DB::statement("COMMENT ON COLUMN user_chat.updated_at IS " . $pdo->quote('Data e hora da última atualização do registro.'));
        }
        DB::statement("COMMENT ON COLUMN user_team.created_at IS " . $pdo->quote('Data e hora de criação do registro.')); 
        DB::statement("COMMENT ON COLUMN user_team.id IS " . $pdo->quote('Identificador único do registro da tabela user_team.')); 
        DB::statement("COMMENT ON COLUMN user_team.team_id IS " . $pdo->quote('Referência a identificador do time relacionada à tabela user_team.')); 
        DB::statement("COMMENT ON COLUMN user_team.updated_at IS " . $pdo->quote('Data e hora da última atualização do registro.')); 
        DB::statement("COMMENT ON COLUMN user_team.user_id IS " . $pdo->quote('Referência a identificador do usuário relacionada à tabela user_team.')); 
    }

    public function down(): void
    {
        // Os comentários documentam o próprio esquema e permanecem válidos após rollback.
    }
};
