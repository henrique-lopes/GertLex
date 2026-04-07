<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Contratos de honorários
        Schema::create('fee_agreements', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();

            $table->foreignId('workspace_id')
                  ->constrained('workspaces')
                  ->cascadeOnDelete();

            $table->foreignId('case_id')
                  ->constrained('cases')
                  ->cascadeOnDelete();

            $table->foreignId('client_id')
                  ->constrained('clients')
                  ->cascadeOnDelete();

            $table->string('title');
            $table->enum('type', ['fixed', 'success', 'fixed_success', 'hourly', 'pro_bono']);

            // Valores
            $table->decimal('fixed_amount', 12, 2)->nullable();
            $table->decimal('success_percentage', 5, 2)->nullable();
            $table->decimal('hourly_rate', 10, 2)->nullable();
            $table->decimal('total_estimated', 12, 2)->nullable();

            // Parcelamento
            $table->integer('installments')->default(1);
            $table->date('first_due_date')->nullable();
            $table->enum('installment_interval', ['monthly', 'bimonthly', 'quarterly'])->default('monthly');

            $table->enum('status', ['draft', 'active', 'completed', 'canceled'])->default('active');

            $table->text('notes')->nullable();
            $table->string('document_url')->nullable(); // PDF do contrato assinado

            $table->date('signed_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['workspace_id', 'status']);
            $table->index('case_id');
        });

        // Cobranças / parcelas
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();

            $table->foreignId('workspace_id')
                  ->constrained('workspaces')
                  ->cascadeOnDelete();

            $table->foreignId('fee_agreement_id')
                  ->nullable()
                  ->constrained('fee_agreements')
                  ->nullOnDelete();

            $table->foreignId('case_id')
                  ->nullable()
                  ->constrained('cases')
                  ->nullOnDelete();

            $table->foreignId('client_id')
                  ->constrained('clients')
                  ->cascadeOnDelete();

            $table->string('description');
            $table->integer('installment_number')->default(1);
            $table->integer('installment_total')->default(1);

            $table->decimal('amount', 12, 2);
            $table->decimal('discount', 12, 2)->default(0);
            $table->decimal('late_fee', 12, 2)->default(0);
            $table->decimal('amount_paid', 12, 2)->default(0);

            $table->date('due_date');
            $table->date('paid_at')->nullable();

            $table->enum('status', [
                'pending',   // aguardando
                'paid',      // pago
                'overdue',   // vencido
                'partial',   // pago parcialmente
                'canceled',  // cancelado
            ])->default('pending');

            $table->enum('payment_method', [
                'pix', 'boleto', 'credit_card',
                'transfer', 'cash', 'check', 'other',
            ])->nullable();

            // Integração Asaas
            $table->string('asaas_payment_id')->nullable();
            $table->string('asaas_invoice_url')->nullable();
            $table->string('asaas_pix_key')->nullable();
            $table->string('asaas_barcode')->nullable();

            // Distribuição por advogado (JSON: {user_id: percentage})
            $table->json('lawyer_split')->nullable();

            $table->foreignId('created_by')
                  ->nullable()
                  ->constrained('users')
                  ->nullOnDelete();

            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['workspace_id', 'status']);
            $table->index(['workspace_id', 'due_date']);
            $table->index('client_id');
            $table->index('case_id');
        });

        // Despesas do escritório
        Schema::create('expenses', function (Blueprint $table) {
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

            $table->string('description');

            $table->enum('category', [
                'office',        // aluguel, condomínio
                'staff',         // salários, pró-labore
                'legal_costs',   // custas processuais
                'travel',        // deslocamento
                'technology',    // software, infra
                'marketing',     // publicidade
                'taxes',         // impostos
                'other',
            ])->default('other');

            $table->decimal('amount', 12, 2);
            $table->date('expense_date');
            $table->boolean('is_reimbursable')->default(false);
            $table->boolean('is_reimbursed')->default(false);

            $table->string('receipt_url')->nullable(); // comprovante
            $table->text('notes')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->index(['workspace_id', 'expense_date']);
            $table->index(['workspace_id', 'category']);
        });

        // Horas trabalhadas (para fee_type = hourly)
        Schema::create('time_entries', function (Blueprint $table) {
            $table->id();

            $table->foreignId('workspace_id')
                  ->constrained('workspaces')
                  ->cascadeOnDelete();

            $table->foreignId('case_id')
                  ->constrained('cases')
                  ->cascadeOnDelete();

            $table->foreignId('user_id')
                  ->constrained('users')
                  ->cascadeOnDelete();

            $table->string('description');
            $table->decimal('hours', 5, 2);
            $table->decimal('rate', 10, 2)->nullable();
            $table->decimal('total', 12, 2)->nullable();
            $table->date('worked_at');
            $table->boolean('is_billed')->default(false);

            $table->timestamps();

            $table->index(['case_id', 'user_id']);
            $table->index(['workspace_id', 'worked_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('time_entries');
        Schema::dropIfExists('expenses');
        Schema::dropIfExists('invoices');
        Schema::dropIfExists('fee_agreements');
    }
};
