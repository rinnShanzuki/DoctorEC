import React, { useState, useEffect, useCallback } from 'react';
import { cachedGet } from '../services/apiCache';
import productImages from '../clientside/data/productImages';
import ShopContext from './ShopContext';

export const ShopProvider = ({ children }) => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchProducts = useCallback(async (forceRefresh = false) => {
        if (loading && !forceRefresh && products.length > 0) return;
        setLoading(true);
        try {
            const { data: response } = await cachedGet('/products', { forceRefresh });
            // Backend returns {status, data, message} where data is the products array
            const productsData = response.data?.data || response.data || [];

                // Map backend image paths to bundled imports or full URLs
                const mapped = productsData.map((p) => {
                    const imgPath = p.image || '';
                    let finalImage = productImages['glass1.jpg']; // Default fallback
                    
                    // Extract basename if backend prepended full URL to a local demo image
                    let fileName = imgPath;
                    if (imgPath.includes('/storage/')) {
                        fileName = imgPath.substring(imgPath.lastIndexOf('/storage/') + 9);
                    }

                    if (fileName && productImages[fileName]) {
                        finalImage = productImages[fileName];
                    } else if (fileName && productImages[fileName.replace(/^\//, '')]) {
                        finalImage = productImages[fileName.replace(/^\//, '')];
                    } else if (imgPath.startsWith('http')) {
                        finalImage = imgPath;
                    } else if (imgPath) {
                        // Image already has full URL or relative
                        finalImage = imgPath;
                    }

                    return {
                        ...p,
                        image: finalImage,
                    };
                });
                setProducts(mapped);
                setLoading(false);
            } catch (err) {
                console.error("Error fetching products:", err);
                if (err.response) {
                    console.error("Error response data:", err.response.data);
                    console.error("Error response status:", err.response.status);
                    console.error("Error response headers:", err.response.headers);
                } else if (err.request) {
                    console.error("Error request:", err.request);
                } else {
                    console.error("Error message:", err.message);
                }
                setError(err.message || 'Failed to fetch products');
            } finally {
                setLoading(false);
            }
        }, [loading, products.length]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const [appointments, setAppointments] = useState([]);

    const addAppointment = (appointmentData) => {
        setAppointments((prev) => [...prev, { ...appointmentData, id: Date.now() }]);
        console.log('Appointment booked:', appointmentData);
    };

    const value = {
        products,
        setProducts,
        loading,
        error,
        appointments,
        addAppointment,
        refetchProducts: () => fetchProducts(true)
    };

    return (
        <ShopContext.Provider value={value}>
            {children}
        </ShopContext.Provider>
    );
};

export default ShopProvider;
