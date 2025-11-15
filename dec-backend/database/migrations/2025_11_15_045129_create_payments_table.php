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
        Schema::create('payments', function (Blueprint $table) {
            $table->id('payment_id');
            $table->decimal('amount', 10, 2);
            $table->enum('method', ['cash', 'gcash', 'card']);
            $table->enum('status', ['pending', 'paid', 'refunded'])->default('pending');
            $table->string('reference_number')->nullable();
            $table->foreignId('st_id')
                ->constrained('sales_transactions', 'st_id')
                ->onDelete('cascade');
            $table->foreignId('appointment_id')
                ->constrained('appointments', 'appointment_id')
                ->onDelete('cascade');
            $table->foreignId('client_id')
                ->constrained('client_accounts', 'client_id')
                ->onDelete('cascade');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
