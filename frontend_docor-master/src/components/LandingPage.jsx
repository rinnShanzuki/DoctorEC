import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Home from '../clientside/pages/Home';

/**
 * LandingPage component - renders Home as landing page for guests
 * Redirects authenticated users to /home
 */
const LandingPage = () => {
    const { user, loading } = useAuth();

    // Show loading state while checking authentication
    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                fontSize: '1.5rem',
                color: '#5D4037'
            }}>
                Loading...
            </div>
        );
    }

    // If user is logged in, redirect to /home
    if (user) {
        return <Navigate to="/home" replace />;
    }

    // Guest users see the landing page
    return <Home />;
};

export default LandingPage;
