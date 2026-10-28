<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
{
    Schema::create('friend', function (Blueprint $table) {
        $table->id()->comment('Identificador único do registro da tabela friend.');
        
        // Quem enviou o convite
        $table->foreignUuid('requester_id')->constrained('users')->cascadeOnDelete()->comment('Referência a usuário que enviou a solicitação relacionada à tabela friend.');
        // Quem recebeu o convite
        $table->foreignUuid('addressee_id')->constrained('users')->cascadeOnDelete()->comment('Referência a usuário que recebeu a solicitação relacionada à tabela friend.');
        
        // Status da amizade
        $table->enum('status', ['pending', 'accepted', 'blocked'])->default('pending')->comment('Estado atual do registro de friend.');

        $table->timestamp('created_at')->nullable()->comment('Data e hora de criação do registro.');
            $table->timestamp('updated_at')->nullable()->comment('Data e hora da última atualização do registro.'); // Cria created_at e updated_at automaticamente

        // Garante que A não consiga enviar dois convites para B
        $table->unique(['requester_id', 'addressee_id']);
    });
}

    public function down(): void
    {
        Schema::dropIfExists('friend');
    }
};