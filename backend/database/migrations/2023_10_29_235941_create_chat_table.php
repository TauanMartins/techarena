<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('chat', function (Blueprint $table) {$table->id()->comment('Chave primária autoincrementável.');
            $table->dateTime('created_at')->useCurrent()->comment('Data e hora de criação do registro.');
            $table->boolean('is_group_chat')->default(false)->comment('Refere-se a um chat de time/agendamento?');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('chat');
    }
};