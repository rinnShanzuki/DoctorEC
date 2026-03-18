<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Adds missing performance indexes based on verified current DB schema.
     * Skips any indexes that already exist to prevent duplicate key errors.
     */
    public function up(): void
    {
        // ─── SALES TRANSACTIONS ─────────────────────────────────────
        // Has: transaction_date_index, created_at_index, customer_id_foreign
        // Needs: nothing more (status column no longer exists in this table)
        // Nothing to add here.

        // ─── PAYMENTS ───────────────────────────────────────────────
        // Has: st_id_foreign, appointment_id_foreign, client_id_foreign (FK indexes only)
        // No standalone non-FK indexes.
        Schema::table('payments', function (Blueprint $table) {
            if (!$this->hasIndex('payments', 'idx_payments_status')) {
                $table->index('status', 'idx_payments_status');
            }
        });

        // ─── PATIENTS ───────────────────────────────────────────────
        // Has: patient_code_unique, client_id_foreign
        Schema::table('patients', function (Blueprint $table) {
            if (!$this->hasIndex('patients', 'idx_patients_client')) {
                $table->index('client_id', 'idx_patients_client');
            }
            if (!$this->hasIndex('patients', 'idx_patients_lastname')) {
                $table->index('last_name', 'idx_patients_lastname');
            }
        });

        // ─── PATIENT RECORDS ────────────────────────────────────────
        // Has: patient_id_foreign, admin_id_foreign (FK only)
        Schema::table('patient_records', function (Blueprint $table) {
            if (!$this->hasIndex('patient_records', 'idx_patrec_patient')) {
                $table->index('patient_id', 'idx_patrec_patient');
            }
        });

        // ─── PRESCRIPTIONS ─────────────────────────────────────────
        // Has: appointment_id_foreign, client_id_foreign, doctor_id_foreign (FK only)
        Schema::table('prescriptions', function (Blueprint $table) {
            if (!$this->hasIndex('prescriptions', 'idx_prescriptions_appointment')) {
                $table->index('appointment_id', 'idx_prescriptions_appointment');
            }
            if (!$this->hasIndex('prescriptions', 'idx_prescriptions_doctor')) {
                $table->index('doctor_id', 'idx_prescriptions_doctor');
            }
            // Note: column is client_id in prescriptions table
            if (!$this->hasIndex('prescriptions', 'idx_prescriptions_client')) {
                $table->index('client_id', 'idx_prescriptions_client');
            }
        });

        // ─── DOCTOR SCHEDULES ──────────────────────────────────────
        // Has: doctor_id_foreign, appointment_id_foreign (FK only)
        Schema::table('doctor_schedules', function (Blueprint $table) {
            if (!$this->hasIndex('doctor_schedules', 'idx_docsched_doctor')) {
                $table->index('doctor_id', 'idx_docsched_doctor');
            }
            if (!$this->hasIndex('doctor_schedules', 'idx_docsched_date')) {
                $table->index('schedule_date', 'idx_docsched_date');
            }
            if (!$this->hasIndex('doctor_schedules', 'idx_docsched_status')) {
                $table->index('status', 'idx_docsched_status');
            }
        });

        // ─── CLIENT ACCOUNTS ─────────────────────────────────────────
        // Has: email_unique, role_id_foreign (FK only)
        Schema::table('client_accounts', function (Blueprint $table) {
            if (!$this->hasIndex('client_accounts', 'idx_clients_role')) {
                $table->index('role_id', 'idx_clients_role');
            }
        });

        // ─── ADMIN ACCOUNTS ──────────────────────────────────────────
        // Has: email_unique, role_id_foreign (FK only)
        Schema::table('admin_accounts', function (Blueprint $table) {
            if (!$this->hasIndex('admin_accounts', 'idx_admins_role')) {
                $table->index('role_id', 'idx_admins_role');
            }
        });

        // ─── DOCTORS ─────────────────────────────────────────────────
        // Has: PRIMARY only
        Schema::table('doctors', function (Blueprint $table) {
            if (!$this->hasIndex('doctors', 'idx_doctors_status')) {
                $table->index('status', 'idx_doctors_status');
            }
        });

        // ─── CUSTOMERS ──────────────────────────────────────────────
        // Has: customer_code_unique only
        Schema::table('customers', function (Blueprint $table) {
            if (!$this->hasIndex('customers', 'idx_customers_email')) {
                $table->index('email', 'idx_customers_email');
            }
        });

        // ─── SERVICES ──────────────────────────────────────────────
        // Has: PRIMARY only
        Schema::table('services', function (Blueprint $table) {
            if (!$this->hasIndex('services', 'idx_services_name')) {
                $table->index('name', 'idx_services_name');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $drops = [
            'payments'        => ['idx_payments_status'],
            'patients'        => ['idx_patients_client', 'idx_patients_lastname'],
            'patient_records' => ['idx_patrec_patient'],
            'prescriptions'   => ['idx_prescriptions_appointment', 'idx_prescriptions_doctor', 'idx_prescriptions_client'],
            'doctor_schedules'=> ['idx_docsched_doctor', 'idx_docsched_date', 'idx_docsched_status'],
            'client_accounts' => ['idx_clients_role'],
            'admin_accounts'  => ['idx_admins_role'],
            'doctors'         => ['idx_doctors_status'],
            'customers'       => ['idx_customers_email'],
            'services'        => ['idx_services_name'],
        ];

        foreach ($drops as $table => $indexes) {
            if (!Schema::hasTable($table)) continue;
            Schema::table($table, function (Blueprint $t) use ($indexes) {
                foreach ($indexes as $index) {
                    try { $t->dropIndex($index); } catch (\Exception $e) {}
                }
            });
        }
    }

    /**
     * Check if a named index exists on a table via raw SQL.
     */
    private function hasIndex(string $table, string $indexName): bool
    {
        $result = DB::select("SHOW INDEX FROM `{$table}` WHERE Key_name = ?", [$indexName]);
        return !empty($result);
    }
};
