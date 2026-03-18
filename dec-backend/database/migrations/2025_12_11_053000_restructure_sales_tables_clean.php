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
        Schema::disableForeignKeyConstraints();
        
        // Drop existing tables - recreate with clean structure
        Schema::dropIfExists('sales_services');
        Schema::dropIfExists('sales_items');
        Schema::dropIfExists('sales_transactions');
        
        // Create sales_transactions table (parent)
        Schema::create('sales_transactions', function (Blueprint $table) {
            $table->id('st_id');
            $table->string('customer_name');
            $table->decimal('total_amount', 10, 2);
            $table->decimal('amount_tendered', 10, 2);
            $table->decimal('change_amount', 10, 2)->default(0);
            $table->string('payment_method');
            $table->string('receipt_number')->unique();
            $table->timestamp('transaction_date')->nullable();
            $table->timestamps();
        });

        // Create sales_items table (child - for products)
        Schema::create('sales_items', function (Blueprint $table) {
            $table->id('item_id');
            $table->unsignedBigInteger('product_id');
            $table->integer('quantity');
            $table->decimal('unit_price', 10, 2);
            $table->decimal('subtotal', 10, 2);
            $table->unsignedBigInteger('st_id');
            $table->timestamps();

            $table->foreign('product_id')
                ->references('product_id')
                ->on('products')
                ->onDelete('cascade');
                
            $table->foreign('st_id')
                ->references('st_id')
                ->on('sales_transactions')
                ->onDelete('cascade');
        });

        // Create sales_services table (child - for services)
        Schema::create('sales_services', function (Blueprint $table) {
            $table->id('sservice_id');
            $table->unsignedBigInteger('service_id');
            $table->integer('number_of_sessions')->default(1);
            $table->decimal('unit_price', 10, 2);
            $table->decimal('subtotal', 10, 2);
            $table->unsignedBigInteger('st_id');
            $table->timestamps();

            $table->foreign('service_id')
                ->references('service_id')
                ->on('services')
                ->onDelete('cascade');
                
            $table->foreign('st_id')
                ->references('st_id')
                ->on('sales_transactions')
                ->onDelete('cascade');
        });

        Schema::enableForeignKeyConstraints();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::disableForeignKeyConstraints();
        
        Schema::dropIfExists('sales_services');
        Schema::dropIfExists('sales_items');
        Schema::dropIfExists('sales_transactions');
        
        Schema::enableForeignKeyConstraints();
    }
};
