<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

/**
 * Pure SQL aggregation service for Reports & Analytics.
 * All queries are date-range filtered — no raw records returned.
 * Leverages the indexes added in 2026_03_13_165700_add_comprehensive_indexes.
 */
class ReportsDataService
{
    private string $dateFrom;
    private string $dateTo;

    public function __construct(string $dateFrom, string $dateTo)
    {
        $this->dateFrom = $dateFrom;
        $this->dateTo   = $dateTo . ' 23:59:59'; // include full last day
    }

    // ─────────────────────────────────────────────────────────────────────
    //  APPOINTMENTS
    // ─────────────────────────────────────────────────────────────────────

    public function getAppointmentSummary(): array
    {
        $row = DB::selectOne("
            SELECT
                COUNT(*) as total,
                SUM(status = 'completed') as completed,
                SUM(status = 'cancelled') as cancelled,
                SUM(status = 'pending')   as pending,
                SUM(status = 'approved')  as approved,
                SUM(status = 'ongoing')   as ongoing
            FROM appointments
            WHERE appointment_date BETWEEN ? AND ?
        ", [$this->dateFrom, $this->dateTo]);

        return [
            'total'     => (int)($row->total     ?? 0),
            'completed' => (int)($row->completed ?? 0),
            'cancelled' => (int)($row->cancelled ?? 0),
            'pending'   => (int)($row->pending   ?? 0),
            'approved'  => (int)($row->approved  ?? 0),
            'ongoing'   => (int)($row->ongoing   ?? 0),
        ];
    }

    public function getAppointmentStatusChart(): array
    {
        $rows = DB::select("
            SELECT status, COUNT(*) as count
            FROM appointments
            WHERE appointment_date BETWEEN ? AND ?
            GROUP BY status
        ", [$this->dateFrom, $this->dateTo]);

        $colors = [
            'completed' => '#2e7d32', 'cancelled' => '#c62828',
            'pending'   => '#ef6c00', 'approved'  => '#1565c0', 'ongoing' => '#6a1b9a',
        ];

        return array_map(fn($r) => [
            'name'  => ucfirst($r->status),
            'value' => (int)$r->count,
            'color' => $colors[$r->status] ?? '#8B7355',
        ], $rows);
    }

    public function getAppointmentTrend(): array
    {
        $rows = DB::select("
            SELECT DATE(appointment_date) as date, COUNT(*) as count
            FROM appointments
            WHERE appointment_date BETWEEN ? AND ?
            GROUP BY DATE(appointment_date)
            ORDER BY date ASC
        ", [$this->dateFrom, $this->dateTo]);

        return array_map(fn($r) => [
            'date'  => $r->date,
            'label' => Carbon::parse($r->date)->format('M d'),
            'count' => (int)$r->count,
        ], $rows);
    }

    public function getTopDoctorsByAppointments(int $limit = 5): array
    {
        return DB::select("
            SELECT d.full_name as doctor, COUNT(a.appointment_id) as count
            FROM appointments a
            JOIN doctors d ON a.doctor_id = d.doctor_id
            WHERE a.appointment_date BETWEEN ? AND ?
            GROUP BY d.doctor_id, d.full_name
            ORDER BY count DESC
            LIMIT ?
        ", [$this->dateFrom, $this->dateTo, $limit]);
    }

    public function getTopServicesByAppointments(int $limit = 5): array
    {
        return DB::select("
            SELECT s.name as service, COUNT(a.appointment_id) as count
            FROM appointments a
            JOIN services s ON a.service_id = s.service_id
            WHERE a.appointment_date BETWEEN ? AND ?
            GROUP BY s.service_id, s.name
            ORDER BY count DESC
            LIMIT ?
        ", [$this->dateFrom, $this->dateTo, $limit]);
    }

    /** Returns daily counts for the past 90 days — used by Random Forest training */
    public function getHistoricalDailyCounts(int $days = 90): array
    {
        $from = Carbon::now()->subDays($days)->format('Y-m-d');
        $rows = DB::select("
            SELECT DATE(appointment_date) as date, COUNT(*) as count
            FROM appointments
            WHERE appointment_date >= ?
            GROUP BY DATE(appointment_date)
            ORDER BY date ASC
        ", [$from]);

        return array_map(fn($r) => ['date' => $r->date, 'count' => (int)$r->count], $rows);
    }

    // ─────────────────────────────────────────────────────────────────────
    //  SERVICES
    // ─────────────────────────────────────────────────────────────────────

    public function getServiceStats(): array
    {
        return DB::select("
            SELECT
                s.service_id,
                s.name,
                s.price,
                COUNT(a.appointment_id)                                   as times_availed,
                COALESCE(SUM(s.price), 0)                                 as total_revenue,
                DATEDIFF(NOW(), MAX(a.appointment_date))                  as days_since_last
            FROM services s
            LEFT JOIN appointments a
                ON s.service_id = a.service_id
                AND a.appointment_date BETWEEN ? AND ?
                AND a.status = 'completed'
            GROUP BY s.service_id, s.name, s.price
            ORDER BY times_availed DESC
        ", [$this->dateFrom, $this->dateTo]);
    }

    // ─────────────────────────────────────────────────────────────────────
    //  SALES & INVENTORY
    // ─────────────────────────────────────────────────────────────────────

    public function getSalesSummary(): array
    {
        $row = DB::selectOne("
            SELECT
                COUNT(*) as transaction_count,
                COALESCE(SUM(total_amount), 0)    as total_revenue,
                COALESCE(AVG(total_amount), 0)    as avg_order_value,
                COALESCE(MAX(total_amount), 0)    as max_order_value
            FROM sales_transactions
            WHERE transaction_date BETWEEN ? AND ?
        ", [$this->dateFrom, $this->dateTo]);

        return [
            'transaction_count' => (int)  ($row->transaction_count ?? 0),
            'total_revenue'     => round((float)($row->total_revenue     ?? 0), 2),
            'avg_order_value'   => round((float)($row->avg_order_value   ?? 0), 2),
            'max_order_value'   => round((float)($row->max_order_value   ?? 0), 2),
        ];
    }

    public function getSalesDailyTrend(): array
    {
        $rows = DB::select("
            SELECT
                DATE(transaction_date) as date,
                COUNT(*)               as transactions,
                SUM(total_amount)      as revenue
            FROM sales_transactions
            WHERE transaction_date BETWEEN ? AND ?
            GROUP BY DATE(transaction_date)
            ORDER BY date ASC
        ", [$this->dateFrom, $this->dateTo]);

        return array_map(fn($r) => [
            'date'         => $r->date,
            'label'        => Carbon::parse($r->date)->format('M d'),
            'transactions' => (int)$r->transactions,
            'revenue'      => round((float)$r->revenue, 2),
        ], $rows);
    }

    public function getTopProductsBySales(int $limit = 5): array
    {
        return DB::select("
            SELECT
                p.name,
                p.category,
                SUM(si.quantity)               as qty_sold,
                SUM(si.subtotal)               as revenue
            FROM sales_items si
            JOIN products p ON si.product_id = p.product_id
            JOIN sales_transactions st ON si.st_id = st.st_id
            WHERE st.transaction_date BETWEEN ? AND ?
            GROUP BY p.product_id, p.name, p.category
            ORDER BY qty_sold DESC
            LIMIT ?
        ", [$this->dateFrom, $this->dateTo, $limit]);
    }

    public function getInventorySummary(): array
    {
        $row = DB::selectOne("
            SELECT
                COUNT(*)           as total_products,
                SUM(stock)         as total_stock,
                SUM(price * stock) as total_value,
                SUM(stock < 10)    as low_stock_count,
                SUM(stock = 0)     as out_of_stock_count
            FROM products
        ");

        return [
            'total_products'    => (int)  ($row->total_products    ?? 0),
            'total_stock'       => (int)  ($row->total_stock       ?? 0),
            'total_value'       => round((float)($row->total_value ?? 0), 2),
            'low_stock_count'   => (int)  ($row->low_stock_count   ?? 0),
            'out_of_stock_count'=> (int)  ($row->out_of_stock_count ?? 0),
        ];
    }

    /** Returns product data needed for inventory depletion forecasting */
    public function getProductsForForecasting(): array
    {
        $rows = DB::select("
            SELECT
                p.product_id,
                p.name,
                p.category,
                p.stock,
                COALESCE(SUM(si.quantity) / GREATEST(DATEDIFF(NOW(), MIN(st.transaction_date)), 1), 0) as avg_daily_sales
            FROM products p
            LEFT JOIN sales_items si ON p.product_id = si.product_id
            LEFT JOIN sales_transactions st ON si.st_id = st.st_id
            WHERE p.stock > 0
            GROUP BY p.product_id, p.name, p.category, p.stock
            ORDER BY p.stock ASC
        ");

        return array_map(fn($r) => [
            'product_id'      => $r->product_id,
            'name'            => $r->name,
            'category'        => $r->category,
            'stock'           => (int)$r->stock,
            'avg_daily_sales' => round((float)$r->avg_daily_sales, 4),
        ], $rows);
    }

    // ─────────────────────────────────────────────────────────────────────
    //  PATIENTS
    // ─────────────────────────────────────────────────────────────────────

    public function getPatientSummary(): array
    {
        $row = DB::selectOne("
            SELECT
                COUNT(*) as total_clients,
                SUM(MONTH(created_at) = MONTH(NOW()) AND YEAR(created_at) = YEAR(NOW())) as new_this_month
            FROM client_accounts
        ");

        $active = DB::selectOne("
            SELECT COUNT(DISTINCT client_id) as active
            FROM appointments
            WHERE appointment_date BETWEEN ? AND ?
        ", [$this->dateFrom, $this->dateTo]);

        return [
            'total_clients'  => (int)($row->total_clients  ?? 0),
            'new_this_month' => (int)($row->new_this_month ?? 0),
            'active_clients' => (int)($active->active      ?? 0),
        ];
    }

    public function getRegistrationTrend(int $months = 6): array
    {
        $rows = DB::select("
            SELECT
                DATE_FORMAT(created_at, '%Y-%m') as ym,
                DATE_FORMAT(created_at, '%b %Y') as label,
                COUNT(*) as registrations
            FROM client_accounts
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? MONTH)
            GROUP BY ym, label
            ORDER BY ym ASC
        ", [$months]);

        return array_map(fn($r) => [
            'month'         => $r->label,
            'registrations' => (int)$r->registrations,
        ], $rows);
    }

    public function getPatientInteractionTable(int $limit = 20): array
    {
        return DB::select("
            SELECT
                c.client_id,
                CONCAT(c.first_name, ' ', c.last_name) as name,
                c.email,
                c.created_at                            as registered_at,
                COUNT(DISTINCT a.appointment_id)        as appointments,
                COUNT(DISTINCT pr.prodres_id)           as reservations,
                COALESCE(SUM(st.total_amount), 0)       as total_spent,
                MAX(a.appointment_date)                 as last_appointment
            FROM client_accounts c
            LEFT JOIN appointments a
                ON c.client_id = a.client_id
                AND a.appointment_date BETWEEN ? AND ?
            LEFT JOIN product_reservations pr
                ON c.client_id = pr.client_id
                AND pr.created_at BETWEEN ? AND ?
            LEFT JOIN sales_transactions st
                ON c.client_id = st.customer_id
                AND st.transaction_date BETWEEN ? AND ?
            GROUP BY c.client_id, c.first_name, c.last_name, c.email, c.created_at
            ORDER BY (COUNT(DISTINCT a.appointment_id) + COUNT(DISTINCT pr.prodres_id)) DESC
            LIMIT ?
        ", [
            $this->dateFrom, $this->dateTo,
            $this->dateFrom, $this->dateTo,
            $this->dateFrom, $this->dateTo,
            $limit
        ]);
    }

    /** Returns patient data needed for return likelihood prediction */
    public function getPatientsForPrediction(): array
    {
        $rows = DB::select("
            SELECT
                c.client_id,
                CONCAT(c.first_name, ' ', c.last_name) as name,
                COUNT(DISTINCT a.appointment_id)        as total_visits,
                DATEDIFF(NOW(), MAX(a.appointment_date)) as days_since_last,
                COALESCE(SUM(st.total_amount), 0)       as total_spent
            FROM client_accounts c
            LEFT JOIN appointments a ON c.client_id = a.client_id
            LEFT JOIN sales_transactions st ON c.client_id = st.customer_id
            GROUP BY c.client_id, c.first_name, c.last_name
            HAVING total_visits > 0
            ORDER BY days_since_last ASC
            LIMIT 200
        ");

        return array_map(fn($r) => [
            'client_id'      => $r->client_id,
            'name'           => $r->name,
            'total_visits'   => (int)$r->total_visits,
            'days_since_last'=> (int)($r->days_since_last ?? 365),
            'total_spent'    => round((float)$r->total_spent, 2),
        ], $rows);
    }
}
