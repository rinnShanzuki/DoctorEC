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
            // Drop the existing foreign key constraint
            $table->dropForeign(['client_id']);
            
            // Drop the client_id column
            $table->dropColumn('client_id');
        });

        Schema::table('appointments', function (Blueprint $table) {
            // Add client_id column again but reference users table
            $table->foreignId('client_id')->nullable()->after('patient_id')->constrained('users', 'id')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            // Drop the new foreign key
            $table->dropForeign(['client_id']);
            $table->dropColumn('client_id');
        });

        Schema::table('appointments', function (Blueprint $table) {
            // Restore the original foreign key to client_accounts
            $table->foreignId('client_id')->nullable()->after('patient_id')->constrained('client_accounts', 'client_id')->nullOnDelete();
        });
    }
};
