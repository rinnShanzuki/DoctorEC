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
        Schema::create('products', function (Blueprint $table) {
            $table->id('product_id');
            $table->string('name');
            $table->string('category');
            $table->decimal('price', 10, 2);
            $table->longText('description')->nullable();
            $table->string('image')->nullable();
            $table->integer('stock')->default(0);
            $table->string('shape')->nullable();
            $table->string('features')->nullable();
            $table->string('frame_color')->nullable();
            $table->string('grade_info')->nullable();
            $table->string('target_audience')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
