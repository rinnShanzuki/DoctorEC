<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('prescriptions', function (Blueprint $table) {
            // Add patient_id as nullable (model uses patient_id, table had client_id)
            $table->unsignedBigInteger('patient_id')->nullable()->after('appointment_id');

            // Make eye/lens fields nullable (not all services require them)
            $table->string('left_eye')->nullable()->change();
            $table->string('right_eye')->nullable()->change();
            $table->string('lens_grade')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('prescriptions', function (Blueprint $table) {
            $table->dropColumn('patient_id');
            $table->string('left_eye')->nullable(false)->change();
            $table->string('right_eye')->nullable(false)->change();
            $table->string('lens_grade')->nullable(false)->change();
        });
    }
};
