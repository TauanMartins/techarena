<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('team', function (Blueprint $table) {
            $table->id()->comment('Identificador único para a equipe.');
            $table->string('name', 45)->comment('Nome da equipe.');
            $table->text('description')->nullable()->comment('Descrição da equipe.');
            $table->string('image')->nullable()->comment('URL da imagem da equipe.');
            $table->dateTime('created_at')->useCurrent()->comment('Data e hora de criação do registro.');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('team');
    }
};