<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('appointment', function (Blueprint $table) {
            $table->id()->comment('Identificador único para cada agendamento.');
            $table->date('date')->comment('Data em que o agendamento está marcado.');
            $table->foreignId('sport_arena_id')
                ->constrained('sport_arena')
                ->cascadeOnDelete()
                ->comment('Referência ao local esportivo e modalidade do agendamento.');
            $table->foreignId('schedule_id')
                ->constrained('schedule')
                ->restrictOnDelete()
                ->comment('Referência ao horário do agendamento.');
            $table->foreignId('organizer_id')
                ->constrained('user')
                ->cascadeOnDelete()
                ->comment('Referência ao organizador do agendamento.');
            $table->foreignId('chat_id')
                ->unique()
                ->constrained('chat')
                ->cascadeOnDelete()
                ->comment('Referência exclusiva ao chat do agendamento.');
            $table->foreignId('league_id')
                ->nullable()
                ->constrained('league')
                ->nullOnDelete()
                ->comment('Liga à qual este jogo pertence (null se for amistoso).');

            $table->unique(['sport_arena_id', 'schedule_id', 'date'], 'unique_appointment');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('appointment');
    }
};