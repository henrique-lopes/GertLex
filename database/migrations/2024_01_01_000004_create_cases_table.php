<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Tabela principal: cases (processos judiciais)
        Schema::create('cases', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();

            $table->foreignId('workspace_id')
                  ->constrained('workspaces')
                  ->cascadeOnDelete();

            $table->foreignId('client_id')
                  ->constrained('clients')
                  ->restrictOnDelete();

            $table->foreignId('responsible_user_id')
                  ->nullable()
                  ->constrained('users')
                  ->nullOnDelete();

            // Número CNJ
            $table->string('cnj_number', 30)->nullable();
            $table->string('cnj_number_raw', 20)->nullable();

            // Dados do processo
            $table->string('title');
            $table->enum('area', [
                'civil', 'trabalhista', 'criminal', 'empresarial',
                'tributario', 'familia', 'previdenciario',
                'administrativo', 'ambiental', 'consumidor', 'outro',
            ])->default('civil');

            $table->string('action_type')->nullable();

            // Localização
            $table->string('court')->nullable();
            $table->string('court_city')->nullable();
            $table->string('court_state', 2)->nullable();
            $table->string('tribunal')->nullable();
            $table->string('district')->nullable();

            // Status e fase
            $table->enum('status', [
                'active', 'waiting', 'urgent', 'suspended',
                'archived', 'closed_won', 'closed_lost',
            ])->default('active');

            $table->string('phase')->nullable();

            $table->enum('side', ['author', 'defendant', 'third_party'])->default('author');

            // Partes contrárias
            $table->string('opposing_party')->nullable();
            $table->string('opposing_lawyer')->nullable();
            $table->string('opposing_oab')->nullable();

            // Financeiro
            $table->enum('fee_type', [
                'fixed', 'success', 'fixed_success', 'hourly', 'pro_bono',
            ])->default('fixed');

            $table->decimal('fee_amount', 12, 2)->nullable();
            $table->decimal('fee_success_pct', 5, 2)->nullable();
            $table->decimal('case_value', 14, 2)->nullable();
            $table->decimal('estimated_value', 14, 2)->nullable();

            // Datas
            $table->date('filed_at')->nullable();
            $table->date('closed_at')->nullable();
            $table->date('next_deadline')->nullable();

            // DataJud / IA
            $table->json('datajud_data')->nullable();
            $table->timestamp('datajud_synced_at')->nullable();
            $table->text('ai_summary')->nullable();
            $table->timestamp('ai_summarized_at')->nullable();
            $table->decimal('ai_risk_score', 4, 2)->nullable();

            $table->text('notes')->nullable();
            $table->json('tags')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->index(['workspace_id', 'status']);
            $table->index(['workspace_id', 'area']);
            $table->index(['workspace_id', 'responsible_user_id']);
            $table->index('cnj_number');
            $table->index('next_deadline');
        });

        // Advogados atribuídos ao processo
        Schema::create('case_assignments', function (Blueprint $table) {
            $table->id();

            $table->foreignId('case_id')
                  ->constrained('cases')
                  ->cascadeOnDelete();

            $table->foreignId('user_id')
                  ->constrained('users')
                  ->cascadeOnDelete();

            $table->enum('role', ['lead', 'support', 'intern'])->default('support');
            $table->decimal('billing_percentage', 5, 2)->default(0);
            $table->timestamp('assigned_at')->useCurrent();
            $table->timestamp('removed_at')->nullable();
            $table->boolean('is_active')->default(true);

            $table->timestamps();

            $table->unique(['case_id', 'user_id']);
            $table->index(['user_id', 'is_active']);
        });

        // Movimentações processuais
        Schema::create('case_movements', function (Blueprint $table) {
            $table->id();

            $table->foreignId('case_id')
                  ->constrained('cases')
                  ->cascadeOnDelete();

            $table->string('title');
            $table->text('description')->nullable();
            $table->enum('source', ['manual', 'datajud', 'tribunal_api'])->default('manual');
            $table->string('external_id')->nullable();
            $table->timestamp('occurred_at');

            $table->foreignId('created_by')
                  ->nullable()
                  ->constrained('users')
                  ->nullOnDelete();

            $table->timestamps();

            $table->index(['case_id', 'occurred_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('case_movements');
        Schema::dropIfExists('case_assignments');
        Schema::dropIfExists('cases');
    }
};
