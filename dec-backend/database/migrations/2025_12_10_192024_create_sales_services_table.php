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
        Schema::create('sales_services', function (Blueprint $table) {
            $table->id('sservice_id');
            $table->string('service_name');
            $table->integer('num_sessions')->default(1);
            $table->decimal('unit_price', 10, 2);
            $table->decimal('subtotal', 10, 2);
            $table->unsignedBigInteger('service_id')->nullable();
            $table->unsignedBigInteger('st_id');
            $table->timestamps();

            $table->foreign('st_id')->references('st_id')->on('sales_transactions')->onDelete('cascade');
            $table->foreign('service_id')->references('service_id')->on('services')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sales_services');
    }
};
