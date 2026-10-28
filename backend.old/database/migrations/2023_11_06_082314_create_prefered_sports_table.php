<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('prefered_sports', function (Blueprint $table) {
            $table->foreignUuid('user_id')
                ->constrained('users')
                ->cascadeOnDelete()
                ->comment('ID do usuário.');
            $table->foreignId('sport_id')
                ->constrained('sport')
                ->cascadeOnDelete()
                ->comment('ID do esporte.');

            $table->primary(['user_id', 'sport_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('prefered_sports');
    }
};