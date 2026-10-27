<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
{
    Schema::create('user_team', function (Blueprint $table) {
        $table->id();
        $table->foreignUuid('user_id')->constrained('user')->cascadeOnDelete();
        $table->foreignId('team_id')->constrained('team')->cascadeOnDelete(); // Mantenha o ID do team conforme sua estrutura
        
        // Define se é membro comum ou o capitão/admin do time
        $table->string('role', 20)->default('member')->comment('captain, member');
        
        $table->timestamps();

        $table->unique(['user_id', 'team_id']);
    });
}

    public function down(): void
    {
        Schema::dropIfExists('user_team');
    }
};