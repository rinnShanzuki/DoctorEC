<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\Response;

/**
 * Cache GET API responses to reduce database load.
 * Supports 200 concurrent users by serving cached responses
 * instead of hitting the database for every request.
 */
class CacheResponse
{
    /**
     * Routes that should be cached and their TTL in seconds.
     */
    protected array $cacheablePatterns = [
        'api/v1/products'        => 60,
        'api/v1/services'        => 60,
        'api/v1/site-settings'   => 120,
        'api/v1/doctors'         => 60,
    ];

    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Only cache GET requests
        if ($request->method() !== 'GET') {
            return $next($request);
        }

        // Check if this route should be cached
        $ttl = $this->getCacheTtl($request);
        if ($ttl === null) {
            return $next($request);
        }

        // Generate a unique cache key based on URL + query params
        $cacheKey = 'response_cache:' . md5($request->fullUrl());

        // Return cached response if available
        $cached = Cache::get($cacheKey);
        if ($cached !== null) {
            return response()->json(
                $cached['data'],
                $cached['status'],
                ['X-Cache' => 'HIT']
            );
        }

        // Process the request
        $response = $next($request);

        // Only cache successful JSON responses
        if ($response->getStatusCode() === 200 && $this->isJsonResponse($response)) {
            Cache::put($cacheKey, [
                'data'   => json_decode($response->getContent(), true),
                'status' => $response->getStatusCode(),
            ], $ttl);

            $response->headers->set('X-Cache', 'MISS');
        }

        return $response;
    }

    /**
     * Get cache TTL for the current request path.
     */
    protected function getCacheTtl(Request $request): ?int
    {
        $path = $request->path();

        foreach ($this->cacheablePatterns as $pattern => $ttl) {
            if (str_starts_with($path, $pattern)) {
                return $ttl;
            }
        }

        return null;
    }

    /**
     * Check if the response is JSON.
     */
    protected function isJsonResponse(Response $response): bool
    {
        $contentType = $response->headers->get('Content-Type', '');
        return str_contains($contentType, 'json');
    }
}
