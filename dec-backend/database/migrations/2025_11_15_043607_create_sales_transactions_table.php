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
        Schema::create('sales_transactions', function (Blueprint $table) {
            $table->id('st_id');
            $table->decimal('total_amount', 10, 2)->default(0);
            $table->enum('status', [
                'pending', 'paid', 'refunded', 'cancelled'
            ])->default('pending');
            $table->text('notes')->nullable();
            $table->foreignId('client_id')
                ->constrained('client_accounts', 'client_id')
                ->onDelete('cascade');
            $table->foreignId('admin_id')
                ->constrained('admin_accounts', 'admin_id')
                ->onDelete('cascade');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sales_transactions');
    }
};
