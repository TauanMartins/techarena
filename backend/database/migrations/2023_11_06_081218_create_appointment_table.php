<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
{
    Schema::create('appointment', function (Blueprint $table) {
        $table->id();
        
        // O criador da partida passa a ser um UUID
        $table->foreignUuid('organizer_id')->constrained('user')->cascadeOnDelete();
        
        $table->string('title', 100);
        $table->text('description')->nullable();
        $table->dateTime('scheduled_at'); // Quando vai acontecer
        
        // Controle de estado da partida
        $table->enum('status', ['scheduled', 'in_progress', 'finished', 'canceled'])->default('scheduled');

        // Geolocalização via PostGIS (ponto exato no mapa)
       $table->point('location')->nullable();
        
        // Limite de jogadores (para controlar a tabela user_appointment)
        $table->integer('max_players')->nullable();

        $table->timestamps();
        $table->softDeletes(); // Cria coluna 'deleted_at' (não apaga do banco de verdade)
    });
}

    public function down(): void
    {
        Schema::dropIfExists('appointment');
    }
};