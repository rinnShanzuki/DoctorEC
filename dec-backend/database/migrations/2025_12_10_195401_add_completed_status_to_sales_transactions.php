<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Modify the ENUM to include 'completed'
        DB::statement("ALTER TABLE sales_transactions MODIFY COLUMN status ENUM('pending', 'paid', 'refunded', 'cancelled', 'completed') DEFAULT 'pending'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("ALTER TABLE sales_transactions MODIFY COLUMN status ENUM('pending', 'paid', 'refunded', 'cancelled') DEFAULT 'pending'");
    }
};
