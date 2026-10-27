<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_team', function (Blueprint $table) {
            $table->foreignUuid('user_id')
                ->constrained('user')
                ->cascadeOnDelete();
            $table->foreignId('team_id')
                ->constrained('team')
                ->cascadeOnDelete();
            $table->boolean('leader')->default(false)->comment('Indica se o usuário é líder da equipe.');

            $table->primary(['user_id', 'team_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_team');
    }
};