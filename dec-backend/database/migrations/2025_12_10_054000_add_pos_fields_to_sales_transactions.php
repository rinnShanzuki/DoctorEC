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
        Schema::table('sales_transactions', function (Blueprint $table) {
            // Make client_id nullable for walk-in customers
            $table->foreignId('client_id')->nullable()->change();
            
            // Add new fields for POS functionality
            $table->string('patient_name')->after('st_id');
            $table->string('payment_method')->after('total_amount'); // Cash, Card
            $table->decimal('amount_tendered', 10, 2)->nullable()->after('payment_method');
            $table->decimal('change_amount', 10, 2)->nullable()->after('amount_tendered');
            $table->string('receipt_number')->unique()->after('change_amount');
            $table->timestamp('transaction_date')->after('receipt_number');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sales_transactions', function (Blueprint $table) {
            $table->dropColumn([
                'patient_name',
                'payment_method',
                'amount_tendered',
                'change_amount',
                'receipt_number',
                'transaction_date'
            ]);
        });
    }
};
