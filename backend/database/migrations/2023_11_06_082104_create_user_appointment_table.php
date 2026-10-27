<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_appointment', function (Blueprint $table) {
            $table->foreignId('appointment_id')
                ->constrained('appointment')
                ->cascadeOnDelete()
                ->comment('ID do compromisso.');
            $table->foreignUuid('user_id')
                ->constrained('user')
                ->cascadeOnDelete()
                ->comment('ID do usuário participante.');
            $table->boolean('holder')->default(true)->comment('Indica se o participante vai jogar como titular (true) ou reserva (false).');

            $table->primary(['appointment_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_appointment');
    }
};