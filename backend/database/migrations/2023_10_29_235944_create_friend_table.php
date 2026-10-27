<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
{
    Schema::create('friend', function (Blueprint $table) {
        $table->id();
        
        // Quem enviou o convite
        $table->foreignUuid('requester_id')->constrained('user')->cascadeOnDelete();
        // Quem recebeu o convite
        $table->foreignUuid('addressee_id')->constrained('user')->cascadeOnDelete();
        
        // Status da amizade
        $table->enum('status', ['pending', 'accepted', 'blocked'])->default('pending');

        $table->timestamps(); // Cria created_at e updated_at automaticamente

        // Garante que A não consiga enviar dois convites para B
        $table->unique(['requester_id', 'addressee_id']);
    });
}

    public function down(): void
    {
        Schema::dropIfExists('friend');
    }
};