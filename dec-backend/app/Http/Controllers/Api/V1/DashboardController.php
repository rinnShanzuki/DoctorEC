<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Traits\ApiResponses;
use App\Models\ClientAccount;
use App\Models\Appointment;
use App\Models\ProductReservation;
use App\Models\Product;
use App\Models\Patient;
use App\Models\Doctor;
use App\Models\SalesTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Carbon\Carbon;

class DashboardController extends Controller
{
    use ApiResponses;

    /**
     * Get ALL dashboard data in a single optimized call
     * Returns: card stats, pending appointments, revenue, charts data
     */
    public function getDashboardAll(Request $request)
    {
        try {
            $cacheKey = 'dashboard_all_v2';
            
            $data = Cache::remember($cacheKey, 60, function () {
                // Card Stats
                $totalUsers = ClientAccount::count();
                $totalPatients = DB::table('patients')->count();
                $totalDoctors = DB::table('doctors')->count();
                $totalProducts = Product::count();

                // Pending Appointments (for table)
                $pendingAppointments = Appointment::with(['clientAccount:client_id,first_name,last_name', 'service:service_id,name', 'doctor:doctor_id,full_name'])
                    ->where('status', 'pending')
                    ->orderBy('appointment_date', 'asc')
                    ->limit(10)
                    ->get()
                    ->map(fn($apt) => [
                        'id' => $apt->appointment_id,
                        'clientAccount' => $apt->clientAccount,
                        'service' => $apt->service,
                        'doctor' => $apt->doctor,
                        'appointment_date' => $apt->appointment_date,
                        'appointment_time' => $apt->appointment_time ?? null,
                        'status' => $apt->status,
                    ]);

                // Revenue Snapshot
                $todayRevenue = SalesTransaction::whereDate('created_at', Carbon::today())->sum('total_amount');
                $weekRevenue = SalesTransaction::where('created_at', '>=', Carbon::now()->startOfWeek())->sum('total_amount');
                $monthRevenue = SalesTransaction::where('created_at', '>=', Carbon::now()->startOfMonth())->sum('total_amount');
                $yearRevenue = SalesTransaction::where('created_at', '>=', Carbon::now()->startOfYear())->sum('total_amount');

                // Product Distribution (Pie chart by category)
                $productDistribution = Product::select('category', DB::raw('COUNT(*) as count'), DB::raw('SUM(stock) as stock'))
                    ->groupBy('category')
                    ->get()
                    ->map(fn($item) => [
                        'name' => $item->category ?? 'Uncategorized',
                        'value' => (int) $item->count,
                        'stock' => (int) $item->stock,
                    ]);

                // Appointment Trends (last 6 months) - single aggregate query instead of 18
                $sixMonthsAgo = Carbon::now()->subMonths(5)->startOfMonth();
                $trendRows = Appointment::select(
                        DB::raw("DATE_FORMAT(appointment_date, '%Y-%m') as ym"),
                        DB::raw("DATE_FORMAT(appointment_date, '%b') as month_name"),
                        DB::raw('COUNT(*) as total'),
                        DB::raw("SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed"),
                        DB::raw("SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending")
                    )
                    ->where('appointment_date', '>=', $sixMonthsAgo)
                    ->groupBy('ym', 'month_name')
                    ->orderBy('ym')
                    ->get()
                    ->keyBy('ym');

                $appointmentTrends = [];
                for ($i = 5; $i >= 0; $i--) {
                    $month = Carbon::now()->subMonths($i);
                    $key = $month->format('Y-m');
                    $row = $trendRows->get($key);
                    $appointmentTrends[] = [
                        'name' => $month->format('M'),
                        'total' => $row ? (int) $row->total : 0,
                        'confirmed' => $row ? (int) $row->confirmed : 0,
                        'pending' => $row ? (int) $row->pending : 0,
                    ];
                }

                // Monthly Income Overview (last 6 months) - single aggregate query instead of 6
                $incomeRows = SalesTransaction::select(
                        DB::raw("DATE_FORMAT(created_at, '%Y-%m') as ym"),
                        DB::raw("DATE_FORMAT(created_at, '%b') as month_name"),
                        DB::raw('SUM(total_amount) as income')
                    )
                    ->where('created_at', '>=', $sixMonthsAgo)
                    ->groupBy('ym', 'month_name')
                    ->orderBy('ym')
                    ->get()
                    ->keyBy('ym');

                $monthlyIncome = [];
                for ($i = 5; $i >= 0; $i--) {
                    $month = Carbon::now()->subMonths($i);
                    $key = $month->format('Y-m');
                    $row = $incomeRows->get($key);
                    $monthlyIncome[] = [
                        'name' => $month->format('M'),
                        'income' => $row ? round((float) $row->income, 2) : 0,
                    ];
                }

                return [
                    'stats' => [
                        'totalUsers' => (int) $totalUsers,
                        'totalPatients' => (int) $totalPatients,
                        'totalDoctors' => (int) $totalDoctors,
                        'totalProducts' => (int) $totalProducts,
                    ],
                    'pendingAppointments' => $pendingAppointments,
                    'revenueSnapshot' => [
                        'today' => round((float) $todayRevenue, 2),
                        'week' => round((float) $weekRevenue, 2),
                        'month' => round((float) $monthRevenue, 2),
                        'year' => round((float) $yearRevenue, 2),
                    ],
                    'productDistribution' => $productDistribution,
                    'appointmentTrends' => $appointmentTrends,
                    'monthlyIncome' => $monthlyIncome,
                ];
            });

            return $this->success($data, 'Dashboard data retrieved successfully');
        } catch (\Exception $e) {
            return $this->error('Failed to retrieve dashboard data: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get dashboard statistics (legacy, kept for backward compatibility)
     */
    public function getStats()
    {
        // Use cache for stats
        $stats = Cache::remember('dashboard_stats', 60, function () {
            return [
                'totalUsers' => ClientAccount::count(),
                'totalAppointments' => Appointment::count(),
                'totalReservations' => ProductReservation::count(),
                'pendingAppointments' => Appointment::where('status', 'pending')->count(),
                'totalProducts' => Product::count(),
                'totalSales' => number_format(SalesTransaction::sum('total_amount') ?? 0, 2),
            ];
        });

        return $this->success($stats, 'Dashboard stats retrieved successfully');
    }

    /**
     * Get product distribution by category
     */
    public function getProductDistribution(Request $request)
    {
        $filter = $request->get('filter', 'month');
        
        $products = Product::select('category', DB::raw('SUM(stock) as value'))
            ->groupBy('category')
            ->get()
            ->map(fn($item) => [
                'name' => $item->category ?? 'Uncategorized',
                'value' => (int) $item->value
            ]);

        return $this->success($products, 'Product distribution retrieved');
    }

    /**
     * Helper method to compute reservation trends
     */
    private function computeReservationTrends($filter)
    {
        $data = [];
        switch ($filter) {
            case 'day':
                $hours = ['8am', '10am', '12pm', '2pm', '4pm', '6pm'];
                $todayCount = ProductReservation::whereDate('created_at', Carbon::today())->count();
                foreach ($hours as $hour) {
                    $data[] = ['name' => $hour, 'reservations' => $todayCount];
                }
                break;
            case 'week':
                for ($i = 6; $i >= 0; $i--) {
                    $date = Carbon::now()->subDays($i);
                    $count = ProductReservation::whereDate('created_at', $date)->count();
                    $data[] = ['name' => $date->format('D'), 'reservations' => $count];
                }
                break;
            case 'month':
                for ($i = 1; $i <= 4; $i++) {
                    $start = Carbon::now()->startOfMonth()->addWeeks($i - 1);
                    $end = (clone $start)->addWeek();
                    $count = ProductReservation::whereBetween('created_at', [$start, $end])->count();
                    $data[] = ['name' => "Week $i", 'reservations' => $count];
                }
                break;
            case 'year':
                for ($i = 1; $i <= 12; $i++) {
                    $count = ProductReservation::whereMonth('created_at', $i)
                        ->whereYear('created_at', Carbon::now()->year)
                        ->count();
                    $data[] = ['name' => Carbon::create()->month($i)->format('M'), 'reservations' => $count];
                }
                break;
        }
        return $data;
    }

    /**
     * Helper method to compute appointment trends
     */
    private function computeAppointmentTrends($filter)
    {
        $data = [];
        switch ($filter) {
            case 'day':
                $data = [
                    ['name' => 'Morning', 'appointments' => Appointment::whereDate('appointment_date', Carbon::today())->whereTime('appointment_time', '<', '12:00:00')->count()],
                    ['name' => 'Afternoon', 'appointments' => Appointment::whereDate('appointment_date', Carbon::today())->whereTime('appointment_time', '>=', '12:00:00')->whereTime('appointment_time', '<', '18:00:00')->count()],
                    ['name' => 'Evening', 'appointments' => Appointment::whereDate('appointment_date', Carbon::today())->whereTime('appointment_time', '>=', '18:00:00')->count()],
                ];
                break;
            case 'week':
                for ($i = 6; $i >= 0; $i--) {
                    $date = Carbon::now()->subDays($i);
                    $count = Appointment::whereDate('appointment_date', $date)->count();
                    $data[] = ['name' => $date->format('D'), 'appointments' => $count];
                }
                break;
            case 'month':
                for ($i = 1; $i <= 4; $i++) {
                    $start = Carbon::now()->startOfMonth()->addWeeks($i - 1);
                    $end = (clone $start)->addWeek();
                    $count = Appointment::whereBetween('appointment_date', [$start, $end])->count();
                    $data[] = ['name' => "Week $i", 'appointments' => $count];
                }
                break;
            case 'year':
                for ($i = 1; $i <= 4; $i++) {
                    $start = Carbon::now()->startOfYear()->addMonths(($i - 1) * 3);
                    $end = (clone $start)->addMonths(3);
                    $count = Appointment::whereBetween('appointment_date', [$start, $end])->count();
                    $data[] = ['name' => "Q$i", 'appointments' => $count];
                }
                break;
        }
        return $data;
    }

    /**
     * Get reservation trends
     */
    public function getReservationTrends(Request $request)
    {
        $filter = $request->get('filter', 'week');
        $data = $this->computeReservationTrends($filter);
        return $this->success($data, 'Reservation trends retrieved');
    }

    /**
     * Get appointment trends
     */
    public function getAppointmentTrends(Request $request)
    {
        $filter = $request->get('filter', 'month');
        $data = $this->computeAppointmentTrends($filter);
        return $this->success($data, 'Appointment trends retrieved');
    }
}

