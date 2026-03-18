import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Home from '../clientside/pages/Home';

/**
 * AuthenticatedHome component - renders Home for authenticated users
 * Redirects guests to landing page (/)
 */
const AuthenticatedHome = () => {
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

    // If user is not logged in, redirect to landing page
    if (!user) {
        return <Navigate to="/" replace />;
    }

    // Authenticated users see the home page
    return <Home />;
};

export default AuthenticatedHome;
