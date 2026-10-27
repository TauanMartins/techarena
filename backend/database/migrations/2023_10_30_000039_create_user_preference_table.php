<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_preference', function (Blueprint $table) {
            $table->foreignUuid('user_id')
                ->constrained('user')
                ->cascadeOnDelete()
                ->comment('Referência ao ID do usuário.');
            $table->foreignId('preference_id')
                ->constrained('preference')
                ->cascadeOnDelete()
                ->comment('Referência ao ID da preferência.');
            $table->string('value', 45)->nullable()->comment('Valor da preferência do usuário.');

            $table->primary(['user_id', 'preference_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_preference');
    }
};