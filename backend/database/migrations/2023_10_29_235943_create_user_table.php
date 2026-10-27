<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user', function (Blueprint $table) {
            // A chave primária agora é o UUID vindo do Supabase
            $table->uuid('id')->primary()->comment('Chave primária vinculada ao auth.users do Supabase.');
            
            $table->string('name', 150)->comment('Nome do usuário.');
            $table->string('email', 150)->unique()->comment('E-mail do usuário sincronizado com o Google.');
            
            // Campos de negócio do seu app (podem ser preenchidos depois do login)
            $table->string('username', 45)->unique()->nullable()->comment('Nome de usuário para acesso.');
            $table->date('dt_birth')->nullable()->comment('Data de nascimento do usuário.');
            $table->char('gender', 1)->nullable()->comment('Gênero do usuário.');
            $table->string('image', 150)->nullable()->comment('Foto de perfil (URL do Google ou Storage).');
            
            $table->foreignId('permission_id')
                ->default(1) // Permissão de usuário comum por padrão
                ->constrained('permission');

            $table->dateTime('created_at')->useCurrent();

            // Configura a chave estrangeira apontando para o schema interno do Supabase
            $table->foreign('id')
                  ->references('id')
                  ->on('auth.users')
                  ->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user');
    }
};