<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\SalesTransaction;
use App\Models\SalesItem;
use App\Models\SalesService;
use App\Models\Product;
use App\Traits\ApiResponses;
use Illuminate\Http\Request;
use Carbon\Carbon;

class SalesController extends Controller
{
    use ApiResponses;

    /**
     * Create a new sales transaction
     * One transaction can have multiple items and/or services
     */
    public function createTransaction(Request $request)
    {
        try {
            $validated = $request->validate([
                'customer_name' => 'required|string|max:255',
                'customer_id'   => 'nullable|integer|exists:customers,customer_id',
                'total_amount' => 'required|numeric|min:0',
                'payment_method' => 'required|string',
                'amount_tendered' => 'required|numeric|min:0',
                'items' => 'required|array|min:1',
                'items.*.product_id' => 'nullable|integer',
                'items.*.service_id' => 'nullable|integer',
                'items.*.quantity' => 'required|integer|min:1',
                'items.*.price' => 'required|numeric|min:0',
                'items.*.is_service' => 'required|boolean',
            ]);

            // Generate unique receipt number
            $receiptNumber = 'REC-' . date('Ymd') . '-' . str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT);

            // Calculate change
            $changeAmount = max(0, $validated['amount_tendered'] - $validated['total_amount']);

            // Create the transaction first
            $transaction = SalesTransaction::create([
                'customer_name' => $validated['customer_name'],
                'customer_id'   => $validated['customer_id'] ?? null,
                'total_amount' => $validated['total_amount'],
                'payment_method' => $validated['payment_method'],
                'amount_tendered' => $validated['amount_tendered'],
                'change_amount' => $changeAmount,
                'receipt_number' => $receiptNumber,
                'transaction_date' => now(),
            ]);

            // Process each item - create SalesItem or SalesService records
            foreach ($validated['items'] as $item) {
                $subtotal = $item['quantity'] * $item['price'];
                $isService = $item['is_service'] ?? false;

                if ($isService) {
                    // Create SalesService record
                    $serviceId = $item['service_id'] ?? null;
                    if ($serviceId) {
                        SalesService::create([
                            'service_id' => $serviceId,
                            'number_of_sessions' => $item['quantity'],
                            'unit_price' => $item['price'],
                            'subtotal' => $subtotal,
                            'st_id' => $transaction->st_id,
                        ]);
                    }
                } else {
                    // Create SalesItem record
                    $productId = $item['product_id'] ?? null;
                    if ($productId) {
                        // Check stock availability before creating the sale item
                        $product = Product::find($productId);
                        if ($product) {
                            if ($product->stock < $item['quantity']) {
                                throw new \Exception("Insufficient stock for {$product->name}. Available: {$product->stock}, Requested: {$item['quantity']}");
                            }

                            SalesItem::create([
                                'product_id' => $productId,
                                'quantity' => $item['quantity'],
                                'unit_price' => $item['price'],
                                'subtotal' => $subtotal,
                                'st_id' => $transaction->st_id,
                            ]);

                            // Deduct stock
                            $product->decrement('stock', $item['quantity']);
                        }
                    }
                }
            }

            // Load relationships for response
            $transaction->load(['items.product', 'services.service']);

            return $this->success([
                'transaction' => $transaction,
                'receipt_number' => $receiptNumber,
                'change_amount' => $changeAmount,
            ], 'Transaction completed successfully');

        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->error($e->getMessage(), 422);
        } catch (\Exception $e) {
            return $this->error('Transaction failed: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get all transactions with optional filters
     */
    public function getTransactions(Request $request)
    {
        try {
            $query = SalesTransaction::with(['items.product', 'services.service'])
                ->orderBy('created_at', 'desc');

            // Filter by date range
            $filter = $request->query('filter', 'all');
            $today = Carbon::today();

            switch ($filter) {
                case 'day':
                    $query->whereDate('created_at', $today);
                    break;
                case 'week':
                    $query->whereBetween('created_at', [$today->copy()->startOfWeek(), $today->copy()->endOfWeek()]);
                    break;
                case 'month':
                    $query->whereMonth('created_at', $today->month)
                          ->whereYear('created_at', $today->year);
                    break;
            }

            // Search by receipt number or customer name
            $search = $request->query('search');
            if ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('receipt_number', 'like', "%{$search}%")
                      ->orWhere('customer_name', 'like', "%{$search}%");
                });
            }

            // Check if request wants all (for reports) or paginated
            $all = $request->query('all', false);

            if ($all) {
                $transactions = $query->get();

                $transformed = $transactions->map(function ($transaction) {
                    return [
                        'id' => $transaction->st_id,
                        'receipt_number' => $transaction->receipt_number,
                        'customer_name' => $transaction->customer_name,
                        'total_amount' => $transaction->total_amount,
                        'payment_method' => $transaction->payment_method,
                        'amount_tendered' => $transaction->amount_tendered,
                        'change_amount' => $transaction->change_amount,
                        'transaction_date' => $transaction->transaction_date,
                        'created_at' => $transaction->created_at->toISOString(),
                        'items_count' => $transaction->items->count(),
                        'items_sum' => $transaction->items->sum('quantity'),
                        'services_count' => $transaction->services->count(),
                    ];
                });

                return $this->success($transformed, 'All transactions retrieved successfully');
            }

            $transactions = $query->paginate(20);

            // Transform data
            $transformed = $transactions->getCollection()->map(function ($transaction) {
                return [
                    'id' => $transaction->st_id,
                    'receipt_number' => $transaction->receipt_number,
                    'customer_name' => $transaction->customer_name,
                    'total_amount' => $transaction->total_amount,
                    'payment_method' => $transaction->payment_method,
                    'amount_tendered' => $transaction->amount_tendered,
                    'change_amount' => $transaction->change_amount,
                    'transaction_date' => $transaction->transaction_date,
                    'created_at' => $transaction->created_at->toISOString(),
                    'items_count' => $transaction->items->count(),
                    'items_sum' => $transaction->items->sum('quantity'),
                    'services_count' => $transaction->services->count(),
                ];
            });

            return $this->success([
                'transactions' => $transformed,
                'pagination' => [
                    'current_page' => $transactions->currentPage(),
                    'last_page' => $transactions->lastPage(),
                    'per_page' => $transactions->perPage(),
                    'total' => $transactions->total(),
                ]
            ], 'Transactions retrieved successfully');

        } catch (\Exception $e) {
            return $this->error('Failed to retrieve transactions: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get single transaction with full details
     */
    public function getTransaction($id)
    {
        try {
            $transaction = SalesTransaction::with(['items.product', 'services.service'])->findOrFail($id);

            return $this->success([
                'id' => $transaction->st_id,
                'receipt_number' => $transaction->receipt_number,
                'customer_name' => $transaction->customer_name,
                'total_amount' => $transaction->total_amount,
                'payment_method' => $transaction->payment_method,
                'amount_tendered' => $transaction->amount_tendered,
                'change_amount' => $transaction->change_amount,
                'transaction_date' => $transaction->transaction_date,
                'created_at' => $transaction->created_at->toISOString(),
                'items' => $transaction->items->map(function ($item) {
                    return [
                        'id' => $item->item_id,
                        'name' => $item->product->name ?? 'Unknown Product',
                        'quantity' => $item->quantity,
                        'unit_price' => $item->unit_price,
                        'subtotal' => $item->subtotal,
                        'type' => 'product',
                    ];
                }),
                'services' => $transaction->services->map(function ($service) {
                    return [
                        'id' => $service->sservice_id,
                        'name' => $service->service->name ?? 'Unknown Service',
                        'sessions' => $service->number_of_sessions,
                        'unit_price' => $service->unit_price,
                        'subtotal' => $service->subtotal,
                        'type' => 'service',
                    ];
                }),
            ], 'Transaction retrieved successfully');

        } catch (\Exception $e) {
            return $this->error('Transaction not found: ' . $e->getMessage(), 404);
        }
    }
}
