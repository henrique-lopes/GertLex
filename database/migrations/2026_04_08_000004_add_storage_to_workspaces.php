<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('workspaces', function (Blueprint $table) {
            $table->unsignedInteger('storage_gb')->default(2)->after('max_cases');
            $table->unsignedBigInteger('storage_used_mb')->default(0)->after('storage_gb');
        });
    }

    public function down(): void
    {
        Schema::table('workspaces', function (Blueprint $table) {
            $table->dropColumn(['storage_gb', 'storage_used_mb']);
        });
    }
};
