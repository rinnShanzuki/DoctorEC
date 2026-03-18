import React, { useState, useEffect } from 'react';
import { productsAPI } from '../services/api';
import productImages from '../clientside/data/productImages';
import ShopContext from './ShopContext';

export const ShopProvider = ({ children }) => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await productsAPI.getAll();
                // Backend returns {status, data, message} where data is the products array
                const productsData = response.data.data || response.data || [];

                // Map backend image paths to bundled imports or full URLs
                const mapped = productsData.map((p) => {
                    const imgPath = p.image || '';
                    let finalImage = productImages['glass1.jpg']; // Default fallback

                    if (imgPath && productImages[imgPath]) {
                        finalImage = productImages[imgPath];
                    } else if (imgPath && productImages[imgPath.replace(/^\//, '')]) {
                        finalImage = productImages[imgPath.replace(/^\//, '')];
                    } else if (imgPath.startsWith('http')) {
                        finalImage = imgPath;
                    } else if (imgPath) {
                        // Image already has full URL from backend
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
                setError(err.message);
                setLoading(false);
            }
        };

        fetchProducts();
    }, []);

    const [appointments, setAppointments] = useState([]);

    const addAppointment = (appointmentData) => {
        setAppointments((prev) => [...prev, { ...appointmentData, id: Date.now() }]);
        console.log('Appointment booked:', appointmentData);
    };

    const value = {
        products,
        loading,
        error,
        appointments,
        addAppointment
    };

    return (
        <ShopContext.Provider value={value}>
            {children}
        </ShopContext.Provider>
    );
};

export default ShopProvider;
