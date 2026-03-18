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
        // Drop foreign key constraints first
        Schema::table('sales_items', function (Blueprint $table) {
            // Drop existing foreign keys if they exist
            try {
                $table->dropForeign(['product_id']);
            } catch (\Exception $e) {
                // Foreign key might not exist
            }
            try {
                $table->dropForeign(['prodres_id']);
            } catch (\Exception $e) {
                // Foreign key might not exist
            }
        });

        // Make columns nullable
        Schema::table('sales_items', function (Blueprint $table) {
            $table->unsignedBigInteger('product_id')->nullable()->change();
            $table->unsignedBigInteger('prodres_id')->nullable()->change();
        });

        // Re-add foreign keys with nullable support
        Schema::table('sales_items', function (Blueprint $table) {
            $table->foreign('product_id')
                ->references('product_id')
                ->on('products')
                ->onDelete('set null');
            $table->foreign('prodres_id')
                ->references('prodres_id')
                ->on('product_reservations')
                ->onDelete('set null');
        });

        // Add item_name column if it doesn't exist
        if (!Schema::hasColumn('sales_items', 'item_name')) {
            Schema::table('sales_items', function (Blueprint $table) {
                $table->string('item_name')->nullable()->after('item_id');
            });
        }

        // Add is_service column if it doesn't exist
        if (!Schema::hasColumn('sales_items', 'is_service')) {
            Schema::table('sales_items', function (Blueprint $table) {
                $table->boolean('is_service')->default(false)->after('subtotal');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // This migration is a fix, no need to reverse
    }
};
