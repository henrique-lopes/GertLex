<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Log de auditoria (spatie/laravel-activitylog)
        Schema::create('activity_log', function (Blueprint $table) {
            $table->id();
            $table->string('log_name')->nullable();
            $table->text('description');
            $table->nullableMorphs('subject', 'subject');
            $table->nullableMorphs('causer', 'causer');
            $table->json('properties')->nullable();
            $table->uuid('batch_uuid')->nullable();
            $table->timestamps();

            $table->index('log_name');
            $table->index(['subject_type', 'subject_id']);
            $table->index(['causer_type', 'causer_id']);
        });

        // Notificações do Laravel
        Schema::create('notifications', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('type');
            $table->morphs('notifiable');
            $table->text('data');
            $table->timestamp('read_at')->nullable();
            $table->timestamps();

            $table->index(['notifiable_type', 'notifiable_id', 'read_at']);
        });

        // Convites para o escritório
        Schema::create('workspace_invitations', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();

            $table->foreignId('workspace_id')
                  ->constrained('workspaces')
                  ->cascadeOnDelete();

            $table->foreignId('invited_by')
                  ->constrained('users')
                  ->cascadeOnDelete();

            $table->string('email');
            $table->enum('role', ['admin', 'lawyer', 'intern', 'staff'])->default('lawyer');
            $table->string('token')->unique();

            $table->enum('status', ['pending', 'accepted', 'expired', 'canceled'])->default('pending');
            $table->timestamp('expires_at');
            $table->timestamp('accepted_at')->nullable();

            $table->timestamps();

            $table->index(['workspace_id', 'status']);
            $table->index('token');
        });


        // Configurações do workspace (chave-valor)
        Schema::create('workspace_settings', function (Blueprint $table) {
            $table->id();

            $table->foreignId('workspace_id')
                  ->constrained('workspaces')
                  ->cascadeOnDelete();

            $table->string('key');
            $table->text('value')->nullable();
            $table->string('type')->default('string'); // string, boolean, json, integer

            $table->timestamps();

            $table->unique(['workspace_id', 'key']);
        });

        // Webhooks recebidos (CNJ, tribunais)
        Schema::create('webhook_logs', function (Blueprint $table) {
            $table->id();
            $table->string('source');  // 'datajud', 'asaas', 'tjsp'
            $table->string('event')->nullable();
            $table->json('payload');
            $table->enum('status', ['pending', 'processed', 'failed'])->default('pending');
            $table->text('error')->nullable();
            $table->timestamp('processed_at')->nullable();
            $table->timestamps();

            $table->index(['source', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('webhook_logs');
        Schema::dropIfExists('workspace_settings');
        Schema::dropIfExists('cache_locks');
        Schema::dropIfExists('cache');
        Schema::dropIfExists('job_batches');
        Schema::dropIfExists('failed_jobs');
        Schema::dropIfExists('jobs');
        Schema::dropIfExists('workspace_invitations');
        Schema::dropIfExists('notifications');
        Schema::dropIfExists('activity_log');
    }
};
