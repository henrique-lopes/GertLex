<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Agenda: audiências, prazos e compromissos
        Schema::create('events', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();

            $table->foreignId('workspace_id')
                  ->constrained('workspaces')
                  ->cascadeOnDelete();

            $table->foreignId('case_id')
                  ->nullable()
                  ->constrained('cases')
                  ->nullOnDelete();

            $table->foreignId('created_by')
                  ->nullable()
                  ->constrained('users')
                  ->nullOnDelete();

            $table->string('title');
            $table->text('description')->nullable();

            $table->enum('type', [
                'hearing',        // audiência
                'deadline',       // prazo processual
                'fatal_deadline', // prazo fatal
                'meeting',        // reunião
                'task',           // tarefa interna
                'reminder',       // lembrete
            ])->default('task');

            $table->timestamp('starts_at');
            $table->timestamp('ends_at')->nullable();
            $table->boolean('all_day')->default(false);

            $table->string('location')->nullable();   // "2ª Vara do Trabalho - SP"
            $table->string('meeting_url')->nullable(); // Google Meet, Zoom

            $table->enum('status', ['pending', 'done', 'canceled'])->default('pending');

            // Alertas
            $table->boolean('alert_1d')->default(true);  // alerta D-1
            $table->boolean('alert_5d')->default(true);  // alerta D-5
            $table->boolean('alert_sent')->default(false);

            // Google Calendar sync
            $table->string('google_event_id')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->index(['workspace_id', 'starts_at']);
            $table->index(['workspace_id', 'type', 'status']);
            $table->index('case_id');
        });

        // Participantes de eventos
        Schema::create('event_participants', function (Blueprint $table) {
            $table->id();

            $table->foreignId('event_id')
                  ->constrained('events')
                  ->cascadeOnDelete();

            $table->foreignId('user_id')
                  ->constrained('users')
                  ->cascadeOnDelete();

            $table->enum('status', ['pending', 'accepted', 'declined'])->default('pending');

            $table->timestamps();

            $table->unique(['event_id', 'user_id']);
        });

        // Documentos
        Schema::create('documents', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();

            $table->foreignId('workspace_id')
                  ->constrained('workspaces')
                  ->cascadeOnDelete();

            // Pode ser vinculado a processo ou cliente
            $table->foreignId('case_id')
                  ->nullable()
                  ->constrained('cases')
                  ->nullOnDelete();

            $table->foreignId('client_id')
                  ->nullable()
                  ->constrained('clients')
                  ->nullOnDelete();

            $table->foreignId('uploaded_by')
                  ->nullable()
                  ->constrained('users')
                  ->nullOnDelete();

            $table->string('name');                   // "Petição Inicial.pdf"
            $table->string('original_name');          // nome original do arquivo
            $table->string('mime_type');              // "application/pdf"
            $table->bigInteger('size_bytes');
            $table->string('storage_path');           // caminho no S3/storage
            $table->string('storage_disk')->default('s3');

            $table->enum('category', [
                'petition',     // petição
                'decision',     // decisão/sentença
                'contract',     // contrato
                'evidence',     // prova/documento probatório
                'correspondence',// correspondência
                'id_document',  // documento pessoal do cliente
                'other',
            ])->default('other');

            $table->text('description')->nullable();
            $table->boolean('is_confidential')->default(false);
            $table->boolean('visible_to_client')->default(false); // portal do cliente

            $table->timestamps();
            $table->softDeletes();

            $table->index(['workspace_id', 'case_id']);
            $table->index(['workspace_id', 'client_id']);
            $table->index(['workspace_id', 'category']);
        });

        // Tarefas internas
        Schema::create('tasks', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();

            $table->foreignId('workspace_id')
                  ->constrained('workspaces')
                  ->cascadeOnDelete();

            $table->foreignId('case_id')
                  ->nullable()
                  ->constrained('cases')
                  ->nullOnDelete();

            $table->foreignId('assigned_to')
                  ->nullable()
                  ->constrained('users')
                  ->nullOnDelete();

            $table->foreignId('created_by')
                  ->nullable()
                  ->constrained('users')
                  ->nullOnDelete();

            $table->string('title');
            $table->text('description')->nullable();

            $table->enum('priority', ['low', 'medium', 'high', 'critical'])->default('medium');
            $table->enum('status', ['todo', 'in_progress', 'done', 'canceled'])->default('todo');

            $table->date('due_date')->nullable();
            $table->timestamp('completed_at')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->index(['workspace_id', 'assigned_to', 'status']);
            $table->index(['workspace_id', 'due_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tasks');
        Schema::dropIfExists('documents');
        Schema::dropIfExists('event_participants');
        Schema::dropIfExists('events');
    }
};
