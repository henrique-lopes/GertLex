<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('clients', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();

            // Tenant
            $table->foreignId('workspace_id')
                  ->constrained('workspaces')
                  ->cascadeOnDelete();

            // Advogado responsável principal
            $table->foreignId('responsible_user_id')
                  ->nullable()
                  ->constrained('users')
                  ->nullOnDelete();

            // Tipo: pessoa física ou jurídica
            $table->enum('type', ['individual', 'company'])->default('individual');

            // Pessoa Física
            $table->string('name');
            $table->string('cpf', 14)->nullable();
            $table->date('birth_date')->nullable();
            $table->enum('gender', ['male', 'female', 'other'])->nullable();
            $table->string('rg', 20)->nullable();
            $table->string('nationality')->nullable()->default('Brasileira');
            $table->string('marital_status')->nullable();
            $table->string('profession')->nullable();

            // Pessoa Jurídica
            $table->string('company_name')->nullable();   // razão social
            $table->string('trade_name')->nullable();     // nome fantasia
            $table->string('cnpj', 18)->nullable();
            $table->string('state_registration')->nullable();

            // Contato
            $table->string('email')->nullable();
            $table->string('phone', 20)->nullable();
            $table->string('phone_secondary', 20)->nullable();
            $table->string('whatsapp', 20)->nullable();

            // Endereço
            $table->string('address_street')->nullable();
            $table->string('address_number', 20)->nullable();
            $table->string('address_complement')->nullable();
            $table->string('address_neighborhood')->nullable();
            $table->string('address_city')->nullable();
            $table->string('address_state', 2)->nullable();
            $table->string('address_zipcode', 9)->nullable();

            // Portal do Cliente
            $table->string('portal_token')->nullable()->unique(); // token para acesso externo
            $table->boolean('portal_active')->default(false);
            $table->timestamp('portal_last_access')->nullable();

            // CRM
            $table->enum('status', ['active', 'inactive', 'prospect'])->default('active');
            $table->text('notes')->nullable();
            $table->string('origin')->nullable(); // "indicação", "site", "OAB"
            $table->date('client_since')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->index(['workspace_id', 'type']);
            $table->index(['workspace_id', 'status']);
            $table->index('cpf');
            $table->index('cnpj');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('clients');
    }
};
