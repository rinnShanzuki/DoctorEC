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
        // First add client_id column if it doesn't exist
        if (!Schema::hasColumn('prescriptions', 'client_id')) {
            Schema::table('prescriptions', function (Blueprint $table) {
                $table->unsignedBigInteger('client_id')->nullable()->after('patient_id');
            });
        }

        // Add birthday field to prescriptions for patient demographics
        if (!Schema::hasColumn('prescriptions', 'birthday')) {
            Schema::table('prescriptions', function (Blueprint $table) {
                $table->date('birthday')->nullable()->after('client_id');
            });
        }

        // Add age field to prescriptions
        if (!Schema::hasColumn('prescriptions', 'age')) {
            Schema::table('prescriptions', function (Blueprint $table) {
                $table->integer('age')->nullable()->after('birthday');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('prescriptions', function (Blueprint $table) {
            $table->dropColumn(['client_id', 'birthday', 'age']);
        });
    }
};
