/**
 * API Response Cache with Stale-While-Revalidate + Request Deduplication
 * 
 * Caches GET responses in memory so admin pages load instantly on revisit.
 * Returns cached data immediately, then refreshes in the background.
 * Deduplicates in-flight requests so prefetch and page fetch share one request.
 */
import api from '../services/api';

const cache = new Map();
const inFlight = new Map(); // Track in-flight requests to prevent duplicates
const CACHE_TTL = 2 * 60 * 1000; // 2 minutes

/**
 * Get data from cache or fetch from API (with request deduplication)
 * @param {string} url - API endpoint path (e.g., '/doctors')
 * @param {object} options - { forceRefresh: boolean }
 * @returns {{ data: any, fromCache: boolean }}
 */
export const cachedGet = async (url, options = {}) => {
    const { forceRefresh = false } = options;
    const entry = cache.get(url);
    const now = Date.now();

    // Return cached data if fresh and not forced
    if (entry && !forceRefresh && (now - entry.timestamp < CACHE_TTL)) {
        // Background refresh if older than 30s
        if (now - entry.timestamp > 30000) {
            refreshInBackground(url);
        }
        return { data: entry.data, fromCache: true };
    }

    // If a request for this URL is already in-flight, wait for it (deduplication)
    if (inFlight.has(url)) {
        try {
            const response = await inFlight.get(url);
            return { data: response, fromCache: false };
        } catch (error) {
            if (entry) return { data: entry.data, fromCache: true };
            throw error;
        }
    }

    // Fetch fresh data
    const promise = api.get(url);
    inFlight.set(url, promise);

    try {
        const response = await promise;
        cache.set(url, { data: response, timestamp: Date.now() });
        return { data: response, fromCache: false };
    } catch (error) {
        // If fetch fails but we have stale cache, return it
        if (entry) {
            return { data: entry.data, fromCache: true };
        }
        throw error;
    } finally {
        inFlight.delete(url);
    }
};

/**
 * Silently refresh a cached endpoint in the background
 */
const refreshInBackground = (url) => {
    if (inFlight.has(url)) return; // Don't duplicate
    const promise = api.get(url);
    inFlight.set(url, promise);
    promise.then(response => {
        cache.set(url, { data: response, timestamp: Date.now() });
    }).catch(() => {
        // Silent fail - keep stale cache
    }).finally(() => {
        inFlight.delete(url);
    });
};

/**
 * Invalidate cache for specific URLs or patterns
 * Call this after POST/PUT/DELETE operations
 * @param {string|string[]} urls - URL(s) to invalidate
 */
export const invalidateCache = (urls) => {
    const urlList = Array.isArray(urls) ? urls : [urls];
    urlList.forEach(url => {
        // Remove exact match
        cache.delete(url);
        // Also remove any cache entries that start with this URL
        for (const key of cache.keys()) {
            if (key.startsWith(url)) {
                cache.delete(key);
            }
        }
    });
};

/**
 * Prefetch multiple endpoints in parallel (with deduplication)
 * Call this on AdminLayout mount to warm the cache
 * @param {string[]} urls - Array of API endpoint paths
 */
export const prefetchAll = (urls) => {
    urls.forEach(url => {
        // Only prefetch if not already cached or in-flight
        const entry = cache.get(url);
        if (inFlight.has(url)) return; // Already being fetched
        if (entry && (Date.now() - entry.timestamp < CACHE_TTL)) return; // Still fresh

        const promise = api.get(url);
        inFlight.set(url, promise);
        promise.then(response => {
            cache.set(url, { data: response, timestamp: Date.now() });
        }).catch(() => {
            // Silent fail - don't block anything
        }).finally(() => {
            inFlight.delete(url);
        });
    });
};

/**
 * Clear entire cache (e.g., on logout)
 */
export const clearCache = () => {
    cache.clear();
};

export default { cachedGet, invalidateCache, prefetchAll, clearCache };
