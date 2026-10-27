<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('friend', function (Blueprint $table) {
            $table->foreignId('user_1_id')
                ->constrained('user')
                ->cascadeOnDelete()
                ->comment('Usuário que enviou a solicitação.');
            $table->foreignId('user_2_id')
                ->constrained('user')
                ->cascadeOnDelete()
                ->comment('Usuário que recebeu a solicitação.');
            $table->boolean('user_1_accepted')->default(true)->comment('Usuário 1 aceitou o pedido de amizade?');
            $table->boolean('user_2_accepted')->default(false)->comment('Usuário 2 aceitou o pedido de amizade?');

            // A Primary Key já garante unicidade do par (user_1_id, user_2_id)
            $table->primary(['user_1_id', 'user_2_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('friend');
    }
};