<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
{
    Schema::create('appointment_result', function (Blueprint $table) {
        $table->id()->comment('Identificador único do registro da tabela appointment_result.');
        $table->foreignId('appointment_id')->constrained('appointment')->cascadeOnDelete()->comment('Referência a identificador do agendamento relacionada à tabela appointment_result.');
        
        // Se for jogo de times
        $table->foreignId('winner_team_id')->nullable()->constrained('team')->nullOnDelete()->comment('Referência a identificador do time vencedor relacionada à tabela appointment_result.');
        $table->foreignId('loser_team_id')->nullable()->constrained('team')->nullOnDelete()->comment('Referência a identificador do time perdedor relacionada à tabela appointment_result.');
        
        // Placar final
        $table->integer('winner_score')->nullable()->comment('Pontuação do vencedor de appointment_result.');
        $table->integer('loser_score')->nullable()->comment('Pontuação do perdedor de appointment_result.');
        
        // Observações da partida (MVP, brigas, etc)
        $table->text('notes')->nullable()->comment('Observações de appointment_result.');
        
        $table->timestamp('created_at')->nullable()->comment('Data e hora de criação do registro.');
            $table->timestamp('updated_at')->nullable()->comment('Data e hora da última atualização do registro.');
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('appointment_result');
    }
};
