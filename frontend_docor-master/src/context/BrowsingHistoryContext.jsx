import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import API_CONFIG from '../config/api.config';

const BrowsingHistoryContext = createContext();

/**
 * Browsing History Provider - Tracks user product views and preferences
 * Used for AI-powered recommendations (REQ023, REQ024)
 */
export const BrowsingHistoryProvider = ({ children }) => {
    const [viewedProducts, setViewedProducts] = useState([]);
    const [preferences, setPreferences] = useState({
        favoriteCategories: [],
        priceRange: { min: 0, max: 10000 },
        recentSearches: []
    });

    // Load from localStorage on mount
    useEffect(() => {
        const storedHistory = localStorage.getItem('browsing_history');
        const storedPreferences = localStorage.getItem('user_preferences');

        if (storedHistory) {
            try {
                setViewedProducts(JSON.parse(storedHistory));
            } catch (e) {
                console.error('Error loading browsing history:', e);
            }
        }

        if (storedPreferences) {
            try {
                setPreferences(JSON.parse(storedPreferences));
            } catch (e) {
                console.error('Error loading preferences:', e);
            }
        }
    }, []);

    // Save to localStorage on changes
    useEffect(() => {
        localStorage.setItem('browsing_history', JSON.stringify(viewedProducts));
    }, [viewedProducts]);

    useEffect(() => {
        localStorage.setItem('user_preferences', JSON.stringify(preferences));
    }, [preferences]);

    // Track a product view
    const trackProductView = (product) => {
        if (!product) return;

        const productData = {
            product_id: product.product_id || product.id,
            name: product.name || product.product_name,
            category: product.category,
            price: parseFloat(product.price) || 0,
            image: product.image,
            viewedAt: new Date().toISOString()
        };

        setViewedProducts(prev => {
            // Remove duplicate if exists
            const filtered = prev.filter(p => p.product_id !== productData.product_id);
            // Add to front, keep last 20
            return [productData, ...filtered].slice(0, 20);
        });

        // Update category preferences
        if (product.category) {
            setPreferences(prev => {
                const categories = [...prev.favoriteCategories];
                const existingIdx = categories.findIndex(c => c.name === product.category);

                if (existingIdx >= 0) {
                    categories[existingIdx].count += 1;
                } else {
                    categories.push({ name: product.category, count: 1 });
                }

                // Sort by count and keep top 5
                categories.sort((a, b) => b.count - a.count);

                return {
                    ...prev,
                    favoriteCategories: categories.slice(0, 5)
                };
            });
        }
    };

    // Track a search query
    const trackSearch = (query) => {
        if (!query || query.trim() === '') return;

        setPreferences(prev => {
            const searches = [query, ...prev.recentSearches.filter(s => s !== query)].slice(0, 10);
            return { ...prev, recentSearches: searches };
        });
    };

    // Get recommended products based on history and preferences
    const getRecommendations = (allProducts, limit = 6) => {
        if (!allProducts || allProducts.length === 0) return [];

        const scoredProducts = allProducts.map(product => {
            let score = 0;

            // Boost score based on favorite categories
            const favCategory = preferences.favoriteCategories.find(
                c => c.name === product.category
            );
            if (favCategory) {
                score += favCategory.count * 10;
            }

            // Boost score for products similar to recently viewed
            const recentlyViewed = viewedProducts.slice(0, 5);
            recentlyViewed.forEach(viewed => {
                if (viewed.category === product.category) {
                    score += 5;
                }
                // Similar price range bonus
                const priceDiff = Math.abs((parseFloat(product.price) || 0) - viewed.price);
                if (priceDiff < 500) {
                    score += 3;
                }
            });

            // Penalize already viewed products (show new stuff)
            const wasViewed = viewedProducts.find(v => v.product_id === (product.product_id || product.id));
            if (wasViewed) {
                score -= 15;
            }

            // Add small random factor for variety
            score += Math.random() * 5;

            return { ...product, _score: score };
        });

        // Sort by score and return top recommendations
        scoredProducts.sort((a, b) => b._score - a._score);

        return scoredProducts.slice(0, limit).map(({ _score, ...product }) => product);
    };

    // Get AI-powered recommendations from backend GPT-4o
    const getAIRecommendations = async (isLoggedIn = false) => {
        try {
            const response = await axios.post(
                `${API_CONFIG.BASE_URL}/recommendations`,
                {
                    viewedProducts: viewedProducts.slice(0, 10),
                    preferences: preferences,
                    isLoggedIn: isLoggedIn
                },
                { timeout: 15000 } // 15 second timeout
            );

            if (response.data.success) {
                return {
                    success: true,
                    source: response.data.source,
                    message: response.data.message,
                    recommendations: response.data.recommendations
                };
            }
            throw new Error('Failed to get AI recommendations');
        } catch (error) {
            console.error('AI Recommendations error:', error);
            // Return null to signal that caller should use fallback
            return null;
        }
    };

    // Clear all history
    const clearHistory = () => {
        setViewedProducts([]);
        setPreferences({
            favoriteCategories: [],
            priceRange: { min: 0, max: 10000 },
            recentSearches: []
        });
        localStorage.removeItem('browsing_history');
        localStorage.removeItem('user_preferences');
    };

    const value = {
        viewedProducts,
        preferences,
        trackProductView,
        trackSearch,
        getRecommendations,
        getAIRecommendations,
        clearHistory
    };

    return (
        <BrowsingHistoryContext.Provider value={value}>
            {children}
        </BrowsingHistoryContext.Provider>
    );
};

export const useBrowsingHistory = () => {
    const context = useContext(BrowsingHistoryContext);
    if (!context) {
        throw new Error('useBrowsingHistory must be used within a BrowsingHistoryProvider');
    }
    return context;
};

export default BrowsingHistoryContext;
