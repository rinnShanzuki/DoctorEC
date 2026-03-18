<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('prescriptions', function (Blueprint $table) {
            // Add missing *_sph columns for Rx and Px
            if (!Schema::hasColumn('prescriptions', 'rx_od_sph')) {
                $table->string('rx_od_sph')->nullable()->after('product_required');
            }
            if (!Schema::hasColumn('prescriptions', 'rx_os_sph')) {
                $table->string('rx_os_sph')->nullable()->after('rx_od_va');
            }
            if (!Schema::hasColumn('prescriptions', 'px_od_sph')) {
                $table->string('px_od_sph')->nullable()->after('rx_os_va');
            }
            if (!Schema::hasColumn('prescriptions', 'px_os_sph')) {
                $table->string('px_os_sph')->nullable()->after('px_od_va');
            }
        });
    }

    public function down(): void
    {
        Schema::table('prescriptions', function (Blueprint $table) {
            $table->dropColumn(['rx_od_sph', 'rx_os_sph', 'px_od_sph', 'px_os_sph']);
        });
    }
};
