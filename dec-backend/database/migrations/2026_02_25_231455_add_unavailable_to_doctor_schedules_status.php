<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE doctor_schedules MODIFY COLUMN status ENUM('available', 'booked', 'cancelled', 'unavailable') DEFAULT 'available'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE doctor_schedules MODIFY COLUMN status ENUM('available', 'booked', 'cancelled') DEFAULT 'available'");
    }
};
