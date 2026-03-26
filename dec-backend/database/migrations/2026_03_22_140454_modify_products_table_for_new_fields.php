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
        Schema::table('products', function (Blueprint $table) {
            $table->string('brand')->nullable();
            $table->string('sex')->nullable();
            $table->string('age')->nullable();
            $table->string('tint')->nullable();
            
            if (Schema::hasColumn('products', 'target_audience')) {
                $table->dropColumn('target_audience');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['brand', 'sex', 'age', 'tint']);
            $table->string('target_audience')->nullable();
        });
    }
};
