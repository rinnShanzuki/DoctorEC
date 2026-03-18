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
            $table->date('pickup_date')->nullable()->after('product_id');
            $table->string('payment_mode', 50)->nullable()->after('pickup_date');
            
            // Update status column to use new enum values
            $table->dropColumn('status');
        });
        
        Schema::table('product_reservations', function (Blueprint $table) {
            $table->enum('status', ['Pending', 'Accepted', 'In Process', 'Fulfilled', 'Cancelled'])->default('Pending')->after('payment_mode');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('product_reservations', function (Blueprint $table) {
            $table->dropColumn(['pickup_date', 'payment_mode']);
            $table->dropColumn('status');
        });
        
        Schema::table('product_reservations', function (Blueprint $table) {
            $table->enum('status', ['reserved', 'cancelled', 'fulfilled', 'expired'])->default('reserved');
        });
    }
};
