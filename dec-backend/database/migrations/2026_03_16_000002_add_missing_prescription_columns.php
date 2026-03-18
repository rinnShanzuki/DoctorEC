<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('prescriptions', function (Blueprint $table) {
            if (!Schema::hasColumn('prescriptions', 'left_eye')) {
                $table->string('left_eye')->nullable()->after('pres_id');
            }
            if (!Schema::hasColumn('prescriptions', 'right_eye')) {
                $table->string('right_eye')->nullable()->after('left_eye');
            }
            if (!Schema::hasColumn('prescriptions', 'lens_grade')) {
                $table->string('lens_grade')->nullable()->after('right_eye');
            }
            if (!Schema::hasColumn('prescriptions', 'medical_concern')) {
                $table->text('medical_concern')->nullable()->after('lens_grade');
            }
        });
    }

    public function down(): void
    {
        Schema::table('prescriptions', function (Blueprint $table) {
            $table->dropColumn(['left_eye', 'right_eye', 'lens_grade', 'medical_concern']);
        });
    }
};
