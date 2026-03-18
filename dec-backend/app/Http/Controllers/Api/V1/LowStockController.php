<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;

class LowStockController extends Controller
{
    /**
     * Get low stock and out-of-stock product alerts.
     * Accepts optional ?threshold=N query param (default: 10).
     */
    public function index(Request $request)
    {
        try {
            $threshold = (int) $request->query('threshold', 10);

            // Products with stock below threshold but > 0
            $lowStockProducts = Product::where('stock', '<', $threshold)
                ->where('stock', '>', 0)
                ->select('product_id', 'name', 'stock', 'category', 'price', 'image')
                ->orderBy('stock', 'asc')
                ->get()
                ->map(function ($product) {
                    if ($product->image && !str_starts_with($product->image, 'http')) {
                        $product->image = asset('storage/' . $product->image);
                    }
                    $product->alert_type = 'low_stock';
                    return $product;
                });

            // Products that are completely out of stock
            $outOfStockProducts = Product::where('stock', '<=', 0)
                ->select('product_id', 'name', 'stock', 'category', 'price', 'image')
                ->orderBy('name', 'asc')
                ->get()
                ->map(function ($product) {
                    if ($product->image && !str_starts_with($product->image, 'http')) {
                        $product->image = asset('storage/' . $product->image);
                    }
                    $product->alert_type = 'out_of_stock';
                    return $product;
                });

            // Merge all alerts — out of stock first (higher severity)
            $allAlerts = $outOfStockProducts->merge($lowStockProducts);

            return response()->json([
                'success' => true,
                'data' => [
                    'alerts' => $allAlerts,
                    'summary' => [
                        'low_stock_count' => $lowStockProducts->count(),
                        'out_of_stock_count' => $outOfStockProducts->count(),
                        'total_alerts' => $allAlerts->count(),
                        'threshold' => $threshold,
                    ],
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch stock alerts',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
