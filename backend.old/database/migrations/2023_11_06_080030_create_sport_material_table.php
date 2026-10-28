<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sport_material', function (Blueprint $table) {
            $table->id()->comment('Chave primária autoincrementável.');
            $table->foreignId('sport_id')
                ->constrained('sport')
                ->cascadeOnDelete()
                ->comment('ID do esporte referido.');
            $table->foreignId('material_id')
                ->constrained('material')
                ->cascadeOnDelete()
                ->comment('ID do material referido.');
            $table->boolean('related_to_local')->comment('Material pertence ao local físico (true) ou o jogador providencia (false)?');

            $table->unique(['sport_id', 'material_id'], 'unique_sport_material');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sport_material');
    }
};