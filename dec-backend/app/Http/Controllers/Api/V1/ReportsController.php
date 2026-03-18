<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\ReportsDataService;
use App\Services\RandomForestService;
use App\Traits\ApiResponses;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ReportsController extends Controller
{
    use ApiResponses;

    private function getDateRange(Request $request): array
    {
        $from = $request->get('date_from', now()->subDays(30)->format('Y-m-d'));
        $to   = $request->get('date_to',   now()->format('Y-m-d'));
        return [$from, $to];
    }

    // ─────────────────────────────────────────────────────────────────────
    //  GET /reports/appointments
    // ─────────────────────────────────────────────────────────────────────
    public function appointments(Request $request)
    {
        try {
            [$from, $to] = $this->getDateRange($request);

            $cacheKey = "reports_appointments_{$from}_{$to}";
            $data = Cache::remember($cacheKey, 300, function () use ($from, $to) {
                $svc = new ReportsDataService($from, $to);

                return [
                    'summary'      => $svc->getAppointmentSummary(),
                    'status_chart' => $svc->getAppointmentStatusChart(),
                    'trend_chart'  => $svc->getAppointmentTrend(),
                    'top_services' => $svc->getTopServicesByAppointments(5),
                    'top_doctors'  => $svc->getTopDoctorsByAppointments(5),
                ];
            });

            return $this->success($data, 'Appointment report retrieved');
        } catch (\Exception $e) {
            Log::error('Reports/appointments: ' . $e->getMessage());
            return $this->error('Failed to load appointment report', 500);
        }
    }

    // ─────────────────────────────────────────────────────────────────────
    //  GET /reports/services
    // ─────────────────────────────────────────────────────────────────────
    public function services(Request $request)
    {
        try {
            [$from, $to] = $this->getDateRange($request);

            $cacheKey = "reports_services_{$from}_{$to}";
            $data = Cache::remember($cacheKey, 300, function () use ($from, $to) {
                $svc      = new ReportsDataService($from, $to);
                $services = $svc->getServiceStats();

                // Prepare chart data — top 10 by availed count
                $chart = array_slice(array_map(fn($s) => [
                    'name'  => $s->name,
                    'count' => (int)$s->times_availed,
                ], $services), 0, 10);

                // Full table
                $table = array_map(fn($s) => [
                    'name'           => $s->name,
                    'price'          => '₱' . number_format($s->price, 2),
                    'times_availed'  => (int)$s->times_availed,
                    'total_revenue'  => '₱' . number_format($s->total_revenue ?? 0, 2),
                    'days_since_last'=> (int)($s->days_since_last ?? 0),
                ], $services);

                return [
                    'popularity_chart' => $chart,
                    'table'            => $table,
                ];
            });

            return $this->success($data, 'Service report retrieved');
        } catch (\Exception $e) {
            Log::error('Reports/services: ' . $e->getMessage());
            return $this->error('Failed to load service report', 500);
        }
    }

    // ─────────────────────────────────────────────────────────────────────
    //  GET /reports/sales
    // ─────────────────────────────────────────────────────────────────────
    public function sales(Request $request)
    {
        try {
            [$from, $to] = $this->getDateRange($request);

            $cacheKey = "reports_sales_{$from}_{$to}";
            $data = Cache::remember($cacheKey, 300, function () use ($from, $to) {
                $svc = new ReportsDataService($from, $to);

                return [
                    'summary'      => $svc->getSalesSummary(),
                    'daily_trend'  => $svc->getSalesDailyTrend(),
                    'top_products' => $svc->getTopProductsBySales(10),
                    'inventory'    => $svc->getInventorySummary(),
                ];
            });

            return $this->success($data, 'Sales report retrieved');
        } catch (\Exception $e) {
            Log::error('Reports/sales: ' . $e->getMessage());
            return $this->error('Failed to load sales report', 500);
        }
    }

    // ─────────────────────────────────────────────────────────────────────
    //  GET /reports/patients
    // ─────────────────────────────────────────────────────────────────────
    public function patients(Request $request)
    {
        try {
            [$from, $to] = $this->getDateRange($request);

            $cacheKey = "reports_patients_{$from}_{$to}";
            $data = Cache::remember($cacheKey, 300, function () use ($from, $to) {
                $svc = new ReportsDataService($from, $to);

                return [
                    'summary'            => $svc->getPatientSummary(),
                    'registration_trend' => $svc->getRegistrationTrend(6),
                    'interaction_table'  => $svc->getPatientInteractionTable(20),
                ];
            });

            return $this->success($data, 'Patient report retrieved');
        } catch (\Exception $e) {
            Log::error('Reports/patients: ' . $e->getMessage());
            return $this->error('Failed to load patient report', 500);
        }
    }

    // ─────────────────────────────────────────────────────────────────────
    //  GET /reports/predictions   (TensorFlow primary, PHP fallback)
    // ─────────────────────────────────────────────────────────────────────
    public function predictions(Request $request)
    {
        try {
            $data = Cache::remember('reports_predictions_v2', 1800, function () {
                // ── 1. Try TensorFlow microservice ─────────────────────────
                $tfUrl = env('TF_ML_SERVICE_URL', 'http://localhost:5001');
                try {
                    $tfResponse = Http::timeout(15)->get("{$tfUrl}/predict/all");
                    if ($tfResponse->successful()) {
                        $tf = $tfResponse->json();
                        if (isset($tf['data'])) {
                            $d = $tf['data'];
                            return [
                                'engine'               => 'tensorflow',
                                'appointment_forecast' => $d['appointment_forecast'] ?? [],
                                'service_demand'       => $d['service_demand'] ?? [],
                                'inventory_alerts'     => $d['inventory_alerts'] ?? [],
                                'patient_return'       => $d['patient_return'] ?? [],
                                'generated_at'         => now()->toIso8601String(),
                            ];
                        }
                    }
                } catch (\Exception $tfEx) {
                    Log::warning('TensorFlow service unavailable, falling back to Random Forest: ' . $tfEx->getMessage());
                }

                // ── 2. Fallback: PHP Random Forest ─────────────────────────
                Log::info('Reports/predictions: using PHP Random Forest fallback');
                $dataSvc = new ReportsDataService(
                    now()->subDays(90)->format('Y-m-d'),
                    now()->format('Y-m-d')
                );
                $rf = new RandomForestService(numTrees: 15, maxDepth: 5, minSamples: 2);

                $historicalCounts    = $dataSvc->getHistoricalDailyCounts(90);
                $appointmentForecast = $rf->forecastAppointmentDemand($historicalCounts, 30);

                $serviceStats  = $dataSvc->getServiceStats();
                $servicesForRF = array_map(fn($s) => [
                    'name'            => $s->name,
                    'times_availed'   => (int)$s->times_availed,
                    'days_since_last' => (int)($s->days_since_last ?? 99),
                    'price'           => (float)$s->price,
                ], $serviceStats);
                $serviceDemand = $rf->classifyServiceDemand($servicesForRF);

                $products          = $dataSvc->getProductsForForecasting();
                $inventoryForecast = $rf->forecastInventoryDepletion($products);
                $criticalStock     = array_filter($inventoryForecast, fn($p) => $p['alert'] || $p['warning']);

                $patients     = $dataSvc->getPatientsForPrediction();
                $patientReturn= $rf->predictPatientReturn($patients);

                return [
                    'engine'               => 'random_forest_php',
                    'appointment_forecast' => [
                        'next_30_days'    => $appointmentForecast['total_predicted'],
                        'confidence'      => $appointmentForecast['confidence'],
                        'daily_breakdown' => array_slice($appointmentForecast['forecast'], 0, 14),
                        'model'           => 'random_forest_php',
                    ],
                    'service_demand'       => $serviceDemand,
                    'inventory_alerts'     => array_values($criticalStock),
                    'patient_return'       => [
                        'likely_count'  => $patientReturn['likely_count'],
                        'neutral_count' => $patientReturn['neutral_count'],
                        'at_risk_count' => $patientReturn['at_risk_count'],
                        'at_risk_list'  => array_slice(
                            array_filter($patientReturn['breakdown'], fn($p) => $p['return_likelihood'] === 'at_risk'),
                            0, 10
                        ),
                        'model'         => 'random_forest_php',
                    ],
                    'generated_at'         => now()->toIso8601String(),
                ];
            });

            return $this->success($data, 'Predictions retrieved');
        } catch (\Exception $e) {
            Log::error('Reports/predictions: ' . $e->getMessage());
            return $this->error('Failed to generate predictions: ' . $e->getMessage(), 500);
        }
    }


    // ─────────────────────────────────────────────────────────────────────
    //  GET /reports/ai-insights
    // ─────────────────────────────────────────────────────────────────────
    public function aiInsights(Request $request)
    {
        try {
            [$from, $to] = $this->getDateRange($request);
            $cacheKey = "reports_ai_insights_{$from}_{$to}";

            $data = Cache::remember($cacheKey, 900, function () use ($from, $to) {
                // Gather compact summary data for GPT
                $dataSvc     = new ReportsDataService($from, $to);
                $aptSummary  = $dataSvc->getAppointmentSummary();
                $salesSummary= $dataSvc->getSalesSummary();
                $invSummary  = $dataSvc->getInventorySummary();
                $patSummary  = $dataSvc->getPatientSummary();
                $topServices = $dataSvc->getTopServicesByAppointments(3);
                $topProducts = $dataSvc->getTopProductsBySales(3);

                $apiKey = env('GITHUB_AI_TOKEN');
                if (empty($apiKey)) {
                    return ['insights' => $this->buildFallbackInsights($aptSummary, $salesSummary, $invSummary, $patSummary)];
                }

                $context = json_encode([
                    'date_range'    => "$from to $to",
                    'appointments'  => $aptSummary,
                    'sales'         => $salesSummary,
                    'inventory'     => $invSummary,
                    'patients'      => $patSummary,
                    'top_services'  => $topServices,
                    'top_products'  => $topProducts,
                ]);

                $response = Http::timeout(20)->withHeaders([
                    'Authorization' => 'Bearer ' . $apiKey,
                    'Content-Type'  => 'application/json',
                ])->post('https://models.inference.ai.azure.com/chat/completions', [
                    'model'       => 'gpt-4o',
                    'max_tokens'  => 350,
                    'temperature' => 0.4,
                    'messages'    => [
                        [
                            'role'    => 'system',
                            'content' => 'You are a business analyst for Doctor EC Optical Clinic. Analyze the provided clinic analytics data and generate 4-6 concise, actionable insights in plain text (no markdown, no bullet points with symbols, just numbered sentences). Focus on: what is performing well, what needs attention, and one concrete recommendation.',
                        ],
                        ['role' => 'user', 'content' => $context],
                    ],
                ]);

                $insight = $response->successful()
                    ? ($response->json()['choices'][0]['message']['content'] ?? null)
                    : null;

                return ['insights' => $insight ?? $this->buildFallbackInsights($aptSummary, $salesSummary, $invSummary, $patSummary)];
            });

            return $this->success($data, 'AI insights retrieved');
        } catch (\Exception $e) {
            Log::error('Reports/ai-insights: ' . $e->getMessage());
            return $this->error('Failed to generate AI insights', 500);
        }
    }

    // ─────────────────────────────────────────────────────────────────────
    //  PRIVATE HELPERS
    // ─────────────────────────────────────────────────────────────────────

    private function buildFallbackInsights(array $apt, array $sales, array $inv, array $pat): string
    {
        $lines = [];
        $lines[] = "1. Total appointments in the selected period: {$apt['total']} ({$apt['completed']} completed, {$apt['cancelled']} cancelled).";

        if ($sales['total_revenue'] > 0) {
            $lines[] = "2. Total revenue collected: ₱" . number_format($sales['total_revenue'], 2) . " across {$sales['transaction_count']} transactions.";
        }

        if ($inv['low_stock_count'] > 0) {
            $lines[] = "3. Warning: {$inv['low_stock_count']} product(s) have stock below 10 units and may need restocking soon.";
        } else {
            $lines[] = "3. Inventory levels are healthy with no critical low-stock items detected.";
        }

        $lines[] = "4. {$pat['new_this_month']} new client(s) registered this month. Total active clients in this period: {$pat['active_clients']}.";

        $completionRate = $apt['total'] > 0 ? round($apt['completed'] / $apt['total'] * 100) : 0;
        if ($completionRate < 60) {
            $lines[] = "5. Appointment completion rate is {$completionRate}% — consider following up on pending and cancelled appointments.";
        } else {
            $lines[] = "5. Appointment completion rate is strong at {$completionRate}%.";
        }

        return implode("\n", $lines);
    }
}
