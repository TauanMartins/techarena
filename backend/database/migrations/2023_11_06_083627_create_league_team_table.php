<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('league_team', function (Blueprint $table) {
            $table->foreignId('team_id')
                ->constrained('team')
                ->cascadeOnDelete();
            $table->foreignId('league_id')
                ->constrained('league')
                ->cascadeOnDelete();

            $table->primary(['team_id', 'league_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('league_team');
    }
};