<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('prescriptions', function (Blueprint $table) {
            // ── Rx (Refraction Results) ──
            $table->string('rx_od_sph')->nullable()->after('product_required');
            $table->string('rx_od_cyl')->nullable()->after('rx_od_sph');
            $table->string('rx_od_axis')->nullable()->after('rx_od_cyl');
            $table->string('rx_od_add')->nullable()->after('rx_od_axis');
            $table->string('rx_od_va')->nullable()->after('rx_od_add');

            $table->string('rx_os_sph')->nullable()->after('rx_od_va');
            $table->string('rx_os_cyl')->nullable()->after('rx_os_sph');
            $table->string('rx_os_axis')->nullable()->after('rx_os_cyl');
            $table->string('rx_os_add')->nullable()->after('rx_os_axis');
            $table->string('rx_os_va')->nullable()->after('rx_os_add');

            // ── Prescription (Final Rx) ──
            $table->string('px_od_sph')->nullable()->after('rx_os_va');
            $table->string('px_od_cyl')->nullable()->after('px_od_sph');
            $table->string('px_od_axis')->nullable()->after('px_od_cyl');
            $table->string('px_od_add')->nullable()->after('px_od_axis');
            $table->string('px_od_va')->nullable()->after('px_od_add');

            $table->string('px_os_sph')->nullable()->after('px_od_va');
            $table->string('px_os_cyl')->nullable()->after('px_os_sph');
            $table->string('px_os_axis')->nullable()->after('px_os_cyl');
            $table->string('px_os_add')->nullable()->after('px_os_axis');
            $table->string('px_os_va')->nullable()->after('px_os_add');

            // ── Lens Details ──
            $table->string('pd')->nullable()->after('px_os_va');
            $table->boolean('is_spectacle')->default(false)->after('pd');
            $table->boolean('is_contact_lens')->default(false)->after('is_spectacle');
            $table->string('frame')->nullable()->after('is_contact_lens');
            $table->string('brand')->nullable()->after('frame');
            $table->string('lens')->nullable()->after('brand');
            $table->string('tint')->nullable()->after('lens');

            // ── Other ──
            $table->text('remarks')->nullable()->after('tint');
            $table->string('released_by')->nullable()->after('remarks');
            $table->date('released_date')->nullable()->after('released_by');
            $table->string('claimed_by')->nullable()->after('released_date');
        });
    }

    public function down(): void
    {
        Schema::table('prescriptions', function (Blueprint $table) {
            $table->dropColumn([
                'rx_od_sph', 'rx_od_cyl', 'rx_od_axis', 'rx_od_add', 'rx_od_va',
                'rx_os_sph', 'rx_os_cyl', 'rx_os_axis', 'rx_os_add', 'rx_os_va',
                'px_od_sph', 'px_od_cyl', 'px_od_axis', 'px_od_add', 'px_od_va',
                'px_os_sph', 'px_os_cyl', 'px_os_axis', 'px_os_add', 'px_os_va',
                'pd', 'is_spectacle', 'is_contact_lens',
                'frame', 'brand', 'lens', 'tint',
                'remarks', 'released_by', 'released_date', 'claimed_by',
            ]);
        });
    }
};
