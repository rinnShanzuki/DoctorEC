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
        // Step 1: Drop foreign key constraints and truncate tables to start fresh
        Schema::disableForeignKeyConstraints();
        
        // Drop existing tables - we'll recreate them with new structure
        Schema::dropIfExists('sales_services');
        Schema::dropIfExists('sales_items');
        Schema::dropIfExists('sales_transactions');
        
        // Step 2: Create sales_items table (must be created first - no FK dependencies)
        Schema::create('sales_items', function (Blueprint $table) {
            $table->id('item_id');
            $table->unsignedBigInteger('product_id');
            $table->integer('quantity');
            $table->decimal('unit_price', 10, 2);
            $table->decimal('subtotal', 10, 2);
            $table->timestamps();

            $table->foreign('product_id')
                ->references('product_id')
                ->on('products')
                ->onDelete('cascade');
        });

        // Step 3: Create sales_services table (must be created first - no FK dependencies)
        Schema::create('sales_services', function (Blueprint $table) {
            $table->id('sservice_id');
            $table->unsignedBigInteger('service_id');
            $table->integer('number_of_sessions')->default(1);
            $table->decimal('unit_price', 10, 2);
            $table->decimal('subtotal', 10, 2);
            $table->timestamps();

            $table->foreign('service_id')
                ->references('service_id')
                ->on('services')
                ->onDelete('cascade');
        });

        // Step 4: Create sales_transactions table (references both items and services)
        Schema::create('sales_transactions', function (Blueprint $table) {
            $table->id('st_id');
            $table->string('patient_name');
            $table->decimal('total_amount', 10, 2);
            $table->decimal('amount_tendered', 10, 2);
            $table->decimal('change_amount', 10, 2)->default(0);
            $table->string('payment_method');
            $table->string('receipt_number');
            $table->timestamp('transaction_date')->nullable();
            
            // Nullable foreign keys - transaction can have item OR service OR both
            $table->unsignedBigInteger('sitems_id')->nullable();
            $table->unsignedBigInteger('sservice_id')->nullable();
            
            $table->timestamps();

            $table->foreign('sitems_id')
                ->references('item_id')
                ->on('sales_items')
                ->onDelete('set null');
                
            $table->foreign('sservice_id')
                ->references('sservice_id')
                ->on('sales_services')
                ->onDelete('set null');
        });

        Schema::enableForeignKeyConstraints();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::disableForeignKeyConstraints();
        
        Schema::dropIfExists('sales_transactions');
        Schema::dropIfExists('sales_services');
        Schema::dropIfExists('sales_items');
        
        Schema::enableForeignKeyConstraints();
    }
};
