<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('material', function (Blueprint $table) {
            $table->id()->comment('Chave primária autoincrementável.');
            $table->string('description', 250)->comment('Descrição do material relacionado a um esporte.');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('material');
    }
};