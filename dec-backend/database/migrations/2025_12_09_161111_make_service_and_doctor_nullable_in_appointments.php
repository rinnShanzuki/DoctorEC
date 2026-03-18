<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            // Make service_id and doctor_id nullable
            $table->foreignId('service_id')->nullable()->change();
            $table->foreignId('doctor_id')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            // Revert back to not nullable
            $table->foreignId('service_id')->nullable(false)->change();
            $table->foreignId('doctor_id')->nullable(false)->change();
        });
    }
};
