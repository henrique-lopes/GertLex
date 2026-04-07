<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('workspaces', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();

            // Dados do escritório
            $table->string('name');                          // "Viana & Lima Advogados"
            $table->string('slug')->unique();                // "viana-lima"
            $table->string('cnpj', 18)->nullable()->unique();
            $table->string('oab_seccional', 10)->nullable(); // "SP", "RJ"
            $table->string('oab_number', 20)->nullable();
            $table->string('email');
            $table->string('phone', 20)->nullable();
            $table->string('logo_url')->nullable();

            // Endereço
            $table->string('address_street')->nullable();
            $table->string('address_number', 20)->nullable();
            $table->string('address_complement')->nullable();
            $table->string('address_neighborhood')->nullable();
            $table->string('address_city')->nullable();
            $table->string('address_state', 2)->nullable();
            $table->string('address_zipcode', 9)->nullable();

            // Plano / Assinatura
            $table->enum('plan', ['trial', 'starter', 'pro', 'premium'])->default('trial');
            $table->enum('plan_status', ['trialing', 'active', 'past_due', 'canceled', 'blocked'])->default('trialing');
            $table->timestamp('trial_ends_at')->nullable();
            $table->timestamp('plan_expires_at')->nullable();
            $table->string('asaas_customer_id')->nullable();
            $table->string('asaas_subscription_id')->nullable();

            // Limites do plano (cache para evitar joins)
            $table->integer('max_lawyers')->default(1);
            $table->integer('max_cases')->default(50);
            $table->boolean('has_ai')->default(false);
            $table->boolean('has_client_portal')->default(false);
            $table->boolean('has_white_label')->default(false);

            // Configurações
            $table->string('timezone')->default('America/Sao_Paulo');
            $table->json('settings')->nullable(); // preferências gerais

            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->index('slug');
            $table->index('plan_status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('workspaces');
    }
};
