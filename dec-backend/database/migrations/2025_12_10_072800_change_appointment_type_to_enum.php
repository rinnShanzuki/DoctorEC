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
            // Drop the foreign key constraint first
            $table->dropForeign(['appointment_type_id']);
            
            // Drop the appointment_type_id column
            $table->dropColumn('appointment_type_id');
            
            // Add new appointment_type column as enum
            $table->enum('appointment_type', ['in-person', 'online'])->default('in-person')->after('appointment_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            // Remove the appointment_type column
            $table->dropColumn('appointment_type');
            
            // Restore the appointment_type_id column
            $table->unsignedBigInteger('appointment_type_id')->nullable();
            
            // Restore the foreign key
            $table->foreign('appointment_type_id')->references('apptype_id')->on('appointment_types')->onDelete('cascade');
        });
    }
};
