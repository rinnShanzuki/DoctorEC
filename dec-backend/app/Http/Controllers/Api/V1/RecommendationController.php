<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

class RecommendationController extends Controller
{
    private $apiKey;
    private $apiUrl = 'https://models.inference.ai.azure.com/chat/completions';

    public function __construct()
    {
        $this->apiKey = env('GITHUB_AI_TOKEN');
    }

    /**
     * Get AI-powered product recommendations based on browsing history
     */
    public function getRecommendations(Request $request)
    {
        // Suppress any PHP warnings that might corrupt JSON output
        ob_start();

        $request->validate([
            'viewedProducts' => 'nullable|array',
            'preferences' => 'nullable|array',
            'isLoggedIn' => 'nullable|boolean'
        ]);

        $viewedProducts = $request->input('viewedProducts', []);
        $preferences = $request->input('preferences', []);
        $isLoggedIn = $request->input('isLoggedIn', false);

        try {
            // Get all available products from database
            $allProducts = Product::where('stock', '>', 0)
                ->select('product_id', 'name', 'category', 'price', 'description', 'image', 'created_at')
                ->get()
                ->toArray();

            if (empty($allProducts)) {
                ob_end_clean();
                return response()->json([
                    'success' => false,
                    'message' => 'No products available',
                    'recommendations' => []
                ]);
            }

            // CASE 1: Not logged in - Show recently viewed products
            if (!$isLoggedIn) {
                // If user has viewed products, show those as "Recently Viewed"
                if (!empty($viewedProducts)) {
                    // Get full product details for viewed product IDs
                    $viewedIds = collect($viewedProducts)->pluck('product_id')->filter()->toArray();
                    $recentlyViewed = Product::whereIn('product_id', $viewedIds)
                        ->where('stock', '>', 0)
                        ->select('product_id', 'name', 'category', 'price', 'description', 'image', 'created_at')
                        ->take(6)
                        ->get()
                        ->toArray();

                    if (!empty($recentlyViewed)) {
                        ob_end_clean();
                        return response()->json([
                            'success' => true,
                            'source' => 'recently_viewed',
                            'message' => 'Recently Viewed Products',
                            'recommendations' => $recentlyViewed
                        ]);
                    }
                }

                // Fallback: Show new products if no viewed products
                $startOfMonth = now()->startOfMonth();
                $newProducts = Product::where('stock', '>', 0)
                    ->where('created_at', '>=', $startOfMonth)
                    ->select('product_id', 'name', 'category', 'price', 'description', 'image', 'created_at')
                    ->orderBy('created_at', 'desc')
                    ->take(4)
                    ->get()
                    ->toArray();

                // If no new products this month, get the 4 most recent products
                if (empty($newProducts)) {
                    $newProducts = Product::where('stock', '>', 0)
                        ->select('product_id', 'name', 'category', 'price', 'description', 'image', 'created_at')
                        ->orderBy('created_at', 'desc')
                        ->take(4)
                        ->get()
                        ->toArray();
                }

                ob_end_clean();
                return response()->json([
                    'success' => true,
                    'source' => 'new_arrivals',
                    'message' => 'New Arrivals This Month',
                    'recommendations' => $newProducts
                ]);
            }

            // CASE 2: Logged in but no browsing history (new account) - Return none
            if (empty($viewedProducts)) {
                ob_end_clean();
                return response()->json([
                    'success' => true,
                    'source' => 'none',
                    'message' => 'Browse products to get personalized recommendations',
                    'recommendations' => []
                ]);
            }

            // Check cache first (cache for 5 minutes based on viewed products hash)
            $cacheKey = 'ai_recommendations_' . md5(json_encode($viewedProducts));
            $cached = Cache::get($cacheKey);
            if ($cached) {
                ob_end_clean();
                return response()->json([
                    'success' => true,
                    'source' => 'cached_ai',
                    'message' => $cached['message'],
                    'recommendations' => $cached['recommendations']
                ]);
            }

            // Call GPT-4o for recommendations
            $aiResponse = $this->getAIRecommendations($viewedProducts, $preferences, $allProducts);

            if ($aiResponse['success']) {
                // Cache the result
                Cache::put($cacheKey, $aiResponse, now()->addMinutes(5));
            }

            ob_end_clean();
            return response()->json([
                'success' => true,
                'source' => 'ai',
                'message' => $aiResponse['message'] ?? 'Recommended for you',
                'recommendations' => $aiResponse['recommendations'] ?? []
            ]);

        } catch (\Exception $e) {
            Log::error('AI Recommendation error: ' . $e->getMessage());
            
            // Fallback to algorithm-based recommendations
            $fallbackRecs = $this->getAlgorithmicRecommendations($viewedProducts, $allProducts);
            
            ob_end_clean();
            return response()->json([
                'success' => true,
                'source' => 'fallback',
                'message' => 'Based on your browsing history',
                'recommendations' => $fallbackRecs
            ]);
        }
    }

    /**
     * Get AI-powered recommendations using GPT-4o
     */
    private function getAIRecommendations(array $viewedProducts, array $preferences, array $allProducts): array
    {
        if (empty($this->apiKey)) {
            throw new \Exception('AI API key not configured');
        }

        // Prepare product data for AI (limited to avoid token limits)
        $viewedSummary = collect($viewedProducts)->take(5)->map(function ($p) {
            return [
                'name' => $p['name'] ?? 'Unknown',
                'category' => $p['category'] ?? 'Unknown',
                'price' => $p['price'] ?? 0
            ];
        })->toArray();

        $availableSummary = collect($allProducts)->take(20)->map(function ($p) {
            return [
                'product_id' => $p['product_id'],
                'name' => $p['name'],
                'category' => $p['category'],
                'price' => $p['price']
            ];
        })->toArray();

        $favoriteCategories = $preferences['favoriteCategories'] ?? [];

        $systemPrompt = <<<PROMPT
You are a product recommendation AI for Doctor EC Optical Clinic, an eyewear store.
Analyze the customer's browsing history and recommend the best products for them.

Return your response as valid JSON ONLY, no markdown, no explanation. Format:
{
    "message": "One short sentence explaining why these are recommended",
    "product_ids": [1, 2, 3, 4]
}

Pick exactly 4 product IDs from the available products that best match the customer's preferences.
Consider:
- Categories they've browsed (similar styles)
- Price range they seem to prefer
- Products they haven't seen yet (avoid recommending already viewed items)
PROMPT;

        $userMessage = json_encode([
            'viewed_products' => $viewedSummary,
            'favorite_categories' => $favoriteCategories,
            'available_products' => $availableSummary
        ]);

        $response = Http::timeout(15)
            ->withHeaders([
                'Content-Type' => 'application/json',
                'Authorization' => 'Bearer ' . $this->apiKey,
            ])
            ->post($this->apiUrl, [
                'model' => 'gpt-4o',
                'messages' => [
                    ['role' => 'system', 'content' => $systemPrompt],
                    ['role' => 'user', 'content' => $userMessage]
                ],
                'temperature' => 0.7,
                'max_tokens' => 200,
            ]);

        if (!$response->successful()) {
            throw new \Exception('AI API request failed: ' . $response->status());
        }

        $data = $response->json();
        $content = $data['choices'][0]['message']['content'] ?? '{}';

        // Parse AI response
        $parsed = json_decode($content, true);
        if (!$parsed || !isset($parsed['product_ids'])) {
            throw new \Exception('Invalid AI response format');
        }

        // Get full product details for recommended IDs
        $recommendedIds = array_slice($parsed['product_ids'], 0, 4);
        $recommendations = collect($allProducts)
            ->whereIn('product_id', $recommendedIds)
            ->values()
            ->toArray();

        // If AI returned fewer than 4, fill with random products
        if (count($recommendations) < 4) {
            $viewedIds = collect($viewedProducts)->pluck('product_id')->toArray();
            $remaining = collect($allProducts)
                ->whereNotIn('product_id', array_merge($recommendedIds, $viewedIds))
                ->shuffle()
                ->take(4 - count($recommendations))
                ->values()
                ->toArray();
            $recommendations = array_merge($recommendations, $remaining);
        }

        return [
            'success' => true,
            'message' => $parsed['message'] ?? 'Recommended based on your preferences',
            'recommendations' => $recommendations
        ];
    }

    /**
     * Fallback algorithm-based recommendations (when AI fails)
     */
    private function getAlgorithmicRecommendations(array $viewedProducts, array $allProducts): array
    {
        $viewedIds = collect($viewedProducts)->pluck('product_id')->toArray();
        $viewedCategories = collect($viewedProducts)->pluck('category')->unique()->toArray();

        // Score products based on category match
        $scored = collect($allProducts)
            ->map(function ($product) use ($viewedIds, $viewedCategories) {
                $score = 0;
                
                // Boost for matching category
                if (in_array($product['category'], $viewedCategories)) {
                    $score += 10;
                }
                
                // Penalize already viewed
                if (in_array($product['product_id'], $viewedIds)) {
                    $score -= 20;
                }
                
                // Add random factor
                $score += rand(0, 5);
                
                return array_merge($product, ['_score' => $score]);
            })
            ->sortByDesc('_score')
            ->take(4)
            ->map(function ($p) {
                unset($p['_score']);
                return $p;
            })
            ->values()
            ->toArray();

        return $scored;
    }
}
