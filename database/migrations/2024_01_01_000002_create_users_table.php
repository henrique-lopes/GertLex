<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();

            $table->string('name');
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');

            // Dados profissionais
            $table->string('oab_number', 20)->nullable();   // "123.456"
            $table->string('oab_state', 2)->nullable();     // "SP"
            $table->string('cpf', 14)->nullable()->unique();
            $table->string('phone', 20)->nullable();
            $table->string('avatar_url')->nullable();
            $table->date('birth_date')->nullable();

            // Especialidades (array JSON)
            $table->json('specialties')->nullable(); // ["Trabalhista", "Cível"]

            // Workspace atual ativo (para multi-workspace no futuro)
            $table->foreignId('current_workspace_id')
                  ->nullable()
                  ->constrained('workspaces')
                  ->nullOnDelete();

            $table->rememberToken();
            $table->timestamps();
            $table->softDeletes();

            $table->index('oab_number');
            $table->index('email');
        });

        Schema::create('workspace_members', function (Blueprint $table) {
            $table->id();

            $table->foreignId('workspace_id')
                  ->constrained('workspaces')
                  ->cascadeOnDelete();

            $table->foreignId('user_id')
                  ->constrained('users')
                  ->cascadeOnDelete();

            // Papel dentro do escritório
            $table->enum('role', [
                'owner',    // dono: acesso total + faturamento
                'admin',    // gerencia equipe e financeiro
                'lawyer',   // advogado: seus processos
                'intern',   // estagiário: acesso limitado
                'staff',    // secretária/recepção: sem financeiro
            ])->default('lawyer');

            // Configurações individuais dentro do workspace
            $table->decimal('billing_percentage', 5, 2)->default(0);  // % de êxito
            $table->decimal('hourly_rate', 10, 2)->nullable();         // valor/hora
            $table->boolean('is_active')->default(true);
            $table->timestamp('joined_at')->nullable();
            $table->timestamp('left_at')->nullable();

            $table->json('permissions')->nullable(); // permissões extras granulares

            $table->timestamps();

            $table->unique(['workspace_id', 'user_id']);
            $table->index(['workspace_id', 'role']);
            $table->index(['workspace_id', 'is_active']);
        });



        // Sessões
        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });

        // Reset de senha
        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('sessions');
        Schema::dropIfExists('personal_access_tokens');
        Schema::dropIfExists('workspace_members');
        Schema::dropIfExists('users');
    }
};
