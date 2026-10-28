<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
{
    Schema::create('user_team', function (Blueprint $table) {
        $table->id()->comment('Identificador único do registro da tabela user_team.');
        $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete()->comment('Referência a identificador do usuário relacionada à tabela user_team.');
        $table->foreignId('team_id')->constrained('team')->cascadeOnDelete()->comment('Referência a identificador do time relacionada à tabela user_team.'); // Mantenha o ID do team conforme sua estrutura
        
        // Define se é membro comum ou o capitão/admin do time
        $table->string('role', 20)->default('member')->comment('captain, member');
        
        $table->timestamp('created_at')->nullable()->comment('Data e hora de criação do registro.');
            $table->timestamp('updated_at')->nullable()->comment('Data e hora da última atualização do registro.');

        $table->unique(['user_id', 'team_id']);
    });
}

    public function down(): void
    {
        Schema::dropIfExists('user_team');
    }
};