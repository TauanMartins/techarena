<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
{
    Schema::create('appointment', function (Blueprint $table) {
        $table->id()->comment('Identificador único do registro da tabela appointment.');
        
        // O criador da partida passa a ser um UUID
        $table->foreignUuid('organizer_id')->constrained('users')->cascadeOnDelete()->comment('Referência a identificador do usuário organizador relacionada à tabela appointment.');
        
        $table->string('title', 100)->comment('Título de appointment.');
        $table->text('description')->nullable()->comment('Descrição de appointment.');
        $table->dateTime('scheduled_at')->comment('Data e hora agendadas de appointment.'); // Quando vai acontecer
        
        // Controle de estado da partida
        $table->enum('status', ['scheduled', 'in_progress', 'finished', 'canceled'])->default('scheduled')->comment('Estado atual do registro de appointment.');

        // Geolocalização via PostGIS (ponto exato no mapa)
       $table->point('location')->nullable()->comment('Localização geográfica de appointment.');
        
        // Limite de jogadores (para controlar a tabela user_appointment)
        $table->integer('max_players')->nullable()->comment('Limite de participantes de appointment.');

        $table->timestamp('created_at')->nullable()->comment('Data e hora de criação do registro.');
            $table->timestamp('updated_at')->nullable()->comment('Data e hora da última atualização do registro.');
        $table->timestamp('deleted_at')->nullable()->comment('Data e hora da exclusão lógica do registro.'); // Cria coluna 'deleted_at' (não apaga do banco de verdade)
    });
}

    public function down(): void
    {
        Schema::dropIfExists('appointment');
    }
};