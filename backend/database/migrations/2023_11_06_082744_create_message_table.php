<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('message', function (Blueprint $table) {
            $table->id()->comment('Identificador único da mensagem.');
            $table->text('message')->nullable()->comment('Conteúdo da mensagem enviada.');
            $table->dateTime('created_at')->useCurrent()->comment('Data e hora de criação do registro.');
            $table->foreignId('chat_id')
                ->constrained('chat')
                ->cascadeOnDelete()
                ->comment('Referência ao chat onde a mensagem foi enviada.');
            $table->foreignUuid('user_id')
                ->constrained('user')
                ->cascadeOnDelete()
                ->comment('Referência ao usuário autor da mensagem.');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('message');
    }
};