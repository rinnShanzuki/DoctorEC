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
        Schema::create('product_reservations', function (Blueprint $table) {
            $table->id('prodres_id');
            $table->text('message')->nullable();
            $table->enum('status', [
                'reserved', 'cancelled', 'fulfilled', 'expired'
            ])->default('reserved');
            $table->foreignId('client_id')->constrained('client_accounts', 'client_id')->onDelete('cascade');
            $table->foreignId('product_id')->constrained('products', 'product_id')->onDelete('cascade');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('product_reservations');
    }
};
