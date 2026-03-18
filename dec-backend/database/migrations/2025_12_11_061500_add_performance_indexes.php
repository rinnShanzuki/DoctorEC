<?php

use Illuminate\Database\Migrations\Migration;

/**
 * This migration is now a no-op.
 * All indexes have been consolidated into 2026_03_13_165700_add_comprehensive_indexes.php
 */
return new class extends Migration
{
    public function up(): void
    {
        // Indexes now handled by 2026_03_13_165700_add_comprehensive_indexes
    }

    public function down(): void
    {
        // Nothing to roll back
    }
};
