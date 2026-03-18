<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreProductRequest;
use App\Http\Requests\UpdateProductRequest;
use App\Models\Product;
use App\Traits\ApiResponses;
use App\Events\ProductUpdated;
use Illuminate\Support\Facades\Storage;

class ProductController extends Controller
{
    use ApiResponses;

    /**
     * Get all products with monthly sales stats (public endpoint for client display)
     * Optimized to avoid N+1 query problem
     */
    public function index()
    {
        try {
            // Use subqueries for aggregations instead of N+1 queries
            $currentMonth = now()->month;
            $currentYear = now()->year;

            $products = Product::select('products.*')
                ->selectRaw('(
                    SELECT COALESCE(SUM(si.quantity), 0) 
                    FROM sales_items si 
                    INNER JOIN sales_transactions st ON si.st_id = st.st_id 
                    WHERE si.product_id = products.product_id 
                    AND MONTH(st.transaction_date) = ? 
                    AND YEAR(st.transaction_date) = ?
                ) as monthly_sold', [$currentMonth, $currentYear])
                ->selectRaw('(
                    SELECT COALESCE(SUM(si.quantity), 0) 
                    FROM sales_items si 
                    WHERE si.product_id = products.product_id
                ) as total_sold')
                ->orderBy('created_at', 'desc')
                ->get();

            // Transform products to include full image URL
            $products = $products->map(function ($product) {
                $product->id = $product->product_id;
                if ($product->image && !str_starts_with($product->image, 'http')) {
                    $product->image = asset('storage/' . $product->image);
                }
                $product->monthly_sold = (int) $product->monthly_sold;
                $product->total_sold = (int) $product->total_sold;
                return $product;
            });

            return $this->success($products, 'Products retrieved successfully');
        } catch (\Exception $e) {
            return $this->error('Failed to retrieve products: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Store a new product (admin only)
     */
    public function store(StoreProductRequest $request)
    {
        try {
            $data = $request->validated();

            // Handle image upload
            if ($request->hasFile('image')) {
                $imagePath = $request->file('image')->store('products', 'public');
                $data['image'] = $imagePath;
            }

            $product = Product::create($data);
            $product->id = $product->product_id;

            // Add full image URL
            if ($product->image && !str_starts_with($product->image, 'http')) {
                $product->image = asset('storage/' . $product->image);
            }

            event(new ProductUpdated('created', $product->toArray()));

            return $this->created($product, 'Product created successfully');
        } catch (\Exception $e) {
            return $this->error('Failed to create product: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Update a product (admin only)
     */
    public function update(UpdateProductRequest $request, $id)
    {
        try {
            $product = Product::findOrFail($id);
            $data = $request->validated();

            // Handle image upload
            if ($request->hasFile('image')) {
                // Delete old image if exists
                if ($product->image && !str_starts_with($product->image, 'http')) {
                    Storage::disk('public')->delete($product->image);
                }

                $imagePath = $request->file('image')->store('products', 'public');
                $data['image'] = $imagePath;
            }

            $product->update($data);
            $product->id = $product->product_id;

            // Add full image URL
            if ($product->image && !str_starts_with($product->image, 'http')) {
                $product->image = asset('storage/' . $product->image);
            }

            event(new ProductUpdated('updated', $product->toArray()));

            return $this->success($product, 'Product updated successfully');
        } catch (\Exception $e) {
            return $this->error('Failed to update product: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Delete a product (admin only)
     */
    public function destroy($id)
    {
        try {
            $product = Product::findOrFail($id);

            // Delete image if exists
            if ($product->image && !str_starts_with($product->image, 'http')) {
                Storage::disk('public')->delete($product->image);
            }

            $productId = $product->product_id;
            $product->delete();

            event(new ProductUpdated('deleted', ['product_id' => $productId]));

            return $this->success(null, 'Product deleted successfully');
        } catch (\Exception $e) {
            return $this->error('Failed to delete product: ' . $e->getMessage(), 500);
        }
    }
}
