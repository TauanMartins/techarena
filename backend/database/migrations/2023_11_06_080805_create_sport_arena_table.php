<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sport_arena', function (Blueprint $table) {
            $table->id()->comment('Chave primária autoincrementável.');
            $table->foreignId('sport_id')
                ->constrained('sport')
                ->cascadeOnDelete()
                ->comment('Chave estrangeira referenciando a tabela "sport".');
            $table->foreignId('arena_id')
                ->constrained('arena')
                ->cascadeOnDelete()
                ->comment('Chave estrangeira referenciando a tabela "arena".');

            $table->unique(['sport_id', 'arena_id'], 'unique_sport_arena');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sport_arena');
    }
};