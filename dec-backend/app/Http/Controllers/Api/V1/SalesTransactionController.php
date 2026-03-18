<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\SalesTransaction;
use App\Models\SalesItem;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SalesTransactionController extends Controller
{
    /**
     * Get all transactions
     */
    public function index()
    {
        try {
            $transactions = SalesTransaction::with(['items.product', 'admin'])
                ->orderBy('transaction_date', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $transactions
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch transactions',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create new transaction (POS Sale)
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'patient_name' => 'required|string|max:255',
            'total_amount' => 'required|numeric|min:0',
            'payment_method' => 'required|in:Cash,Card,GCASH',
            'amount_tendered' => 'nullable|numeric|min:0',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'nullable|exists:products,product_id',
            'items.*.name' => 'required|string',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.price' => 'required|numeric|min:0',
            'items.*.is_service' => 'boolean'
        ]);

        try {
            $transaction = DB::transaction(function () use ($validated, $request) {
                // Generate unique receipt number
                $receiptNumber = 'RCP-' . date('Ymd') . '-' . str_pad(SalesTransaction::whereDate('transaction_date', today())->count() + 1, 4, '0', STR_PAD_LEFT);

                // Calculate change for cash payments
                $changeAmount = null;
                if ($validated['payment_method'] === 'Cash' && isset($validated['amount_tendered'])) {
                    $changeAmount = $validated['amount_tendered'] - $validated['total_amount'];
                }

                // Create transaction
                $transaction = SalesTransaction::create([
                    'patient_name' => $validated['patient_name'],
                    'total_amount' => $validated['total_amount'],
                    'payment_method' => $validated['payment_method'],
                    'amount_tendered' => $validated['amount_tendered'] ?? null,
                    'change_amount' => $changeAmount,
                    'receipt_number' => $receiptNumber,
                    'transaction_date' => now(),
                    'status' => 'paid',
                    'notes' => 'POS Sale',
                    'client_id' => null, // Walk-in customer
                    'admin_id' => auth()->id() ?? 1 // Default to admin ID 1 if not authenticated
                ]);

                // Create sales items and update stock
                foreach ($validated['items'] as $item) {
                    $isService = $item['is_service'] ?? false;

                    // Create sales item
                    SalesItem::create([
                        'st_id' => $transaction->st_id,
                        'product_id' => $isService ? null : ($item['product_id'] ?? null),
                        'item_name' => $item['name'],
                        'quantity' => $item['quantity'],
                        'unit_price' => $item['price'],
                        'subtotal' => $item['quantity'] * $item['price'],
                        'is_service' => $isService,
                        'prodres_id' => null
                    ]);

                    // Deduct stock for products (not services)
                    if (!$isService && isset($item['product_id'])) {
                        $product = Product::find($item['product_id']);
                        if ($product) {
                            if ($product->stock < $item['quantity']) {
                                throw new \Exception("Insufficient stock for {$item['name']}");
                            }
                            $product->decrement('stock', $item['quantity']);
                        }
                    }
                }

                return $transaction;
            });

            // Reload with relationships (safely)
            try {
                $transaction = $transaction->fresh(['items']);
            } catch (\Exception $e) {
                // Continue without relationships if loading fails
            }

            // Check for low stock warnings on affected products
            $lowStockWarnings = [];
            $threshold = 10;
            foreach ($validated['items'] as $item) {
                $isService = $item['is_service'] ?? false;
                if (!$isService && isset($item['product_id'])) {
                    $product = Product::find($item['product_id']);
                    if ($product && $product->stock < $threshold) {
                        $lowStockWarnings[] = [
                            'product_id' => $product->product_id,
                            'name' => $product->name,
                            'stock' => $product->stock,
                            'alert_type' => $product->stock <= 0 ? 'out_of_stock' : 'low_stock',
                        ];
                    }
                }
            }

            return response()->json([
                'success' => true,
                'message' => 'Transaction completed successfully',
                'data' => $transaction,
                'low_stock_warnings' => $lowStockWarnings,
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Transaction failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get single transaction
     */
    public function show($id)
    {
        try {
            $transaction = SalesTransaction::with(['items.product', 'admin'])
                ->findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $transaction
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Transaction not found',
                'error' => $e->getMessage()
            ], 404);
        }
    }

    public function getAnalytics()
    {
        try {
            $data = \Illuminate\Support\Facades\Cache::remember('inventory_analytics_v2', 60, function () {
                // Total revenue (all time)
                $totalRevenue = SalesTransaction::sum('total_amount');

                // Today's revenue
                $todayRevenue = SalesTransaction::whereDate('transaction_date', today())
                    ->sum('total_amount');

                // This month's revenue
                $monthRevenue = SalesTransaction::whereMonth('transaction_date', now()->month)
                    ->whereYear('transaction_date', now()->year)
                    ->sum('total_amount');

                // Total transactions
                $totalTransactions = SalesTransaction::count();

                // Best selling products (top 5) - batch load products to avoid N+1
                $bestSellers = [];
                try {
                    $topItems = SalesItem::select('product_id')
                        ->selectRaw('SUM(quantity) as total_sold')
                        ->selectRaw('SUM(subtotal) as total_revenue')
                        ->whereNotNull('product_id')
                        ->groupBy('product_id')
                        ->orderByDesc('total_sold')
                        ->limit(5)
                        ->get();

                    $productIds = $topItems->pluck('product_id')->toArray();
                    $products = Product::whereIn('product_id', $productIds)->pluck('name', 'product_id');

                    $bestSellers = $topItems->map(function ($item) use ($products) {
                        return [
                            'product_id' => $item->product_id,
                            'item_name' => $products->get($item->product_id, 'Unknown Product'),
                            'total_sold' => (int) $item->total_sold,
                            'total_revenue' => (float) $item->total_revenue
                        ];
                    });
                } catch (\Exception $e) {
                    \Log::error('Best sellers error: ' . $e->getMessage());
                    $bestSellers = [];
                }

                // Monthly income (last 6 months) - single aggregate query
                $monthlyIncome = [];
                try {
                    $sixMonthsAgo = now()->subMonths(5)->startOfMonth();
                    $incomeRows = SalesTransaction::select(
                            DB::raw("DATE_FORMAT(transaction_date, '%Y-%m') as ym"),
                            DB::raw("DATE_FORMAT(transaction_date, '%b') as month_name"),
                            DB::raw('SUM(total_amount) as revenue')
                        )
                        ->where('transaction_date', '>=', $sixMonthsAgo)
                        ->groupBy('ym', 'month_name')
                        ->orderBy('ym')
                        ->get()
                        ->keyBy('ym');

                    for ($i = 5; $i >= 0; $i--) {
                        $date = now()->subMonths($i);
                        $key = $date->format('Y-m');
                        $row = $incomeRows->get($key);
                        $monthlyIncome[] = [
                            'month' => $date->format('M'),
                            'year' => $date->year,
                            'revenue' => $row ? (float) $row->revenue : 0
                        ];
                    }
                } catch (\Exception $e) {
                    \Log::error('Monthly income error: ' . $e->getMessage());
                    $monthlyIncome = [];
                }

                // Service statistics - batch load services to avoid N+1
                $serviceStats = [];
                try {
                    $svcItems = \App\Models\SalesService::select('service_id')
                        ->selectRaw('SUM(number_of_sessions) as count')
                        ->whereHas('transaction', function($q) {
                            $q->whereMonth('transaction_date', now()->month)
                              ->whereYear('transaction_date', now()->year);
                        })
                        ->whereNotNull('service_id')
                        ->groupBy('service_id')
                        ->get();

                    $serviceIds = $svcItems->pluck('service_id')->toArray();
                    $serviceNames = \App\Models\Service::whereIn('service_id', $serviceIds)->pluck('name', 'service_id');

                    $serviceStats = $svcItems->map(function ($item) use ($serviceNames) {
                        return [
                            'service_id' => $item->service_id,
                            'name' => $serviceNames->get($item->service_id, 'Unknown Service'),
                            'count' => (int) $item->count
                        ];
                    });
                } catch (\Exception $e) {
                    \Log::error('Service stats error: ' . $e->getMessage());
                    $serviceStats = [];
                }

                // Stock trend (top 5 products by stock count)
                $stockTrend = [];
                try {
                    $stockTrend = Product::select('product_id', 'name', 'stock')
                        ->orderBy('stock', 'desc')
                        ->limit(5)
                        ->get()
                        ->map(function ($product) {
                            return [
                                'product_id' => $product->product_id,
                                'name' => $product->name,
                                'stock' => (int) $product->stock
                            ];
                        });
                } catch (\Exception $e) {
                    \Log::error('Stock trend error: ' . $e->getMessage());
                    $stockTrend = [];
                }

                // Low stock products
                $lowStockProducts = [];
                try {
                    $lowStockProducts = Product::where('stock', '<', 10)
                        ->where('stock', '>', 0)
                        ->select('product_id', 'name', 'stock', 'category')
                        ->get();
                } catch (\Exception $e) {
                    \Log::error('Low stock error: ' . $e->getMessage());
                    $lowStockProducts = [];
                }

                // Out of stock products
                $outOfStockProducts = [];
                try {
                    $outOfStockProducts = Product::where('stock', '<=', 0)
                        ->select('product_id', 'name', 'category')
                        ->get();
                } catch (\Exception $e) {
                    \Log::error('Out of stock error: ' . $e->getMessage());
                    $outOfStockProducts = [];
                }

                return [
                    'total_revenue' => $totalRevenue,
                    'today_revenue' => $todayRevenue,
                    'month_revenue' => $monthRevenue,
                    'total_transactions' => $totalTransactions,
                    'best_sellers' => $bestSellers,
                    'monthly_income' => $monthlyIncome,
                    'service_stats' => $serviceStats,
                    'stock_trend' => $stockTrend,
                    'low_stock_products' => $lowStockProducts,
                    'out_of_stock_products' => $outOfStockProducts
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $data
            ]);
        } catch (\Exception $e) {
            \Log::error('Analytics error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch analytics',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
