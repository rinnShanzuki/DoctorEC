<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('prescriptions', function (Blueprint $table) {
            // Drop the incorrectly defined foreign key (references patients table)
            // Then add correct foreign key to client_accounts
            try {
                $table->dropForeign(['client_id']);
            } catch (\Exception $e) {
                // Foreign key might not exist, continue
            }
            
            // Make sure client_id is nullable and has correct type
            $table->unsignedBigInteger('client_id')->nullable()->change();
            
            // Add foreign key to client_accounts
            $table->foreign('client_id')
                  ->references('client_id')
                  ->on('client_accounts')
                  ->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('prescriptions', function (Blueprint $table) {
            $table->dropForeign(['client_id']);
        });
    }
};
