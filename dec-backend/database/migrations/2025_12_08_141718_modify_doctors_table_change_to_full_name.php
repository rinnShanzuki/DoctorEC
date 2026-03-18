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
        Schema::table('doctors', function (Blueprint $table) {
            // Drop old columns
            $table->dropColumn(['first_name', 'last_name']);
            
            // Add new full_name column
            $table->string('full_name')->after('doctor_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('doctors', function (Blueprint $table) {
            // Restore old columns
            $table->dropColumn('full_name');
            $table->string('first_name')->after('doctor_id');
            $table->string('last_name')->after('first_name');
        });
    }
};
