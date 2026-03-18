<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Add email_verified_at column to client_accounts table.
 * NULL = not verified, timestamp = verified.
 * Also creates the email_verifications table for OTP storage.
 */
return new class extends Migration
{
    public function up(): void
    {
        // Add email_verified_at to client_accounts
        Schema::table('client_accounts', function (Blueprint $table) {
            $table->timestamp('email_verified_at')->nullable()->after('email');
        });

        // Create email_verifications table for OTP codes
        Schema::create('email_verifications', function (Blueprint $table) {
            $table->id();
            $table->string('email')->index();
            $table->string('otp', 6);
            $table->boolean('used')->default(false);
            $table->timestamp('expires_at');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::table('client_accounts', function (Blueprint $table) {
            $table->dropColumn('email_verified_at');
        });

        Schema::dropIfExists('email_verifications');
    }
};
