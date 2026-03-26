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
        Schema::table('prescriptions', function (Blueprint $table) {
            if (Schema::hasColumn('prescriptions', 'left_eye')) {
                $table->dropColumn('left_eye');
            }
            if (Schema::hasColumn('prescriptions', 'right_eye')) {
                $table->dropColumn('right_eye');
            }
            if (Schema::hasColumn('prescriptions', 'lens_grade')) {
                $table->dropColumn('lens_grade');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('prescriptions', function (Blueprint $table) {
            $table->string('left_eye')->nullable();
            $table->string('right_eye')->nullable();
            $table->string('lens_grade')->nullable();
        });
    }
};
