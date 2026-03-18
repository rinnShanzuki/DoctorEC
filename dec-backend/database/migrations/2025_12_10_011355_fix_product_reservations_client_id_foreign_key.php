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
        Schema::table('product_reservations', function (Blueprint $table) {
            // Drop the old foreign key constraint that references users table
            $table->dropForeign(['client_id']);
            
            // Add new foreign key constraint that references client_accounts table
            $table->foreign('client_id')
                ->references('client_id')
                ->on('client_accounts')
                ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('product_reservations', function (Blueprint $table) {
            // Drop the client_accounts foreign key
            $table->dropForeign(['client_id']);
            
            // Restore the old foreign key to users table
            $table->foreign('client_id')
                ->references('id')
                ->on('users')
                ->onDelete('cascade');
        });
    }
};
