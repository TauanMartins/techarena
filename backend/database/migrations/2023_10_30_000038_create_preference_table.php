<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('preference', function (Blueprint $table) {
            $table->id()->comment('Chave primária autoincrementável.');
            $table->string('desc_preference', 45)->unique()->comment('Descrição da preferência.');
            $table->string('default_value', 45)->nullable()->comment('Valor padrão para a preferência.');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('preference');
    }
};