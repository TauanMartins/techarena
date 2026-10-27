<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_chat', function (Blueprint $table) {
            $table->foreignId('chat_id')
                ->constrained('chat')
                ->cascadeOnDelete()
                ->comment('Referência ao chat.');
            $table->foreignUuid('user_id')
                ->constrained('user')
                ->cascadeOnDelete()
                ->comment('Referência ao usuário integrante do chat.');

            // Chave primária composta já aplica índice UNIQUE automaticamente
            $table->primary(['chat_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_chat');
    }
};