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
        Schema::table('sales_items', function (Blueprint $table) {
            // Make foreign keys nullable for services
            $table->foreignId('product_id')->nullable()->change();
            $table->foreignId('prodres_id')->nullable()->change();
            
            // Add item name for services
            $table->string('item_name')->after('item_id');
            
            // Flag to distinguish products from services
            $table->boolean('is_service')->default(false)->after('subtotal');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sales_items', function (Blueprint $table) {
            $table->dropColumn(['item_name', 'is_service']);
        });
    }
};
