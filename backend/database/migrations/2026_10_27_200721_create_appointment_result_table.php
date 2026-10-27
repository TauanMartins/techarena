<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
{
    Schema::create('appointment_result', function (Blueprint $table) {
        $table->id();
        $table->foreignId('appointment_id')->constrained('appointment')->cascadeOnDelete();
        
        // Se for jogo de times
        $table->foreignId('winner_team_id')->nullable()->constrained('team')->nullOnDelete();
        $table->foreignId('loser_team_id')->nullable()->constrained('team')->nullOnDelete();
        
        // Placar final
        $table->integer('winner_score')->nullable();
        $table->integer('loser_score')->nullable();
        
        // Observações da partida (MVP, brigas, etc)
        $table->text('notes')->nullable();
        
        $table->timestamps();
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
