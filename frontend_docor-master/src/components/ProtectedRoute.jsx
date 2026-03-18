import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import adminAuthService from '../services/adminAuthService';
import doctorAuthService from '../services/doctorAuthService';

const ProtectedRoute = ({ children, requireAdmin = false, requireCashier = false, requireDoctor = false }) => {
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

    // If doctor route is required
    if (requireDoctor) {
        const isDoctorAuthenticated = doctorAuthService.isAuthenticated();
        const storedDoctor = doctorAuthService.getStoredDoctor();

        if (!isDoctorAuthenticated || !storedDoctor) {
            return <Navigate to="/login" replace />;
        }

        return children;
    }

    // If cashier route is required
    if (requireCashier) {
        const isAdminAuthenticated = adminAuthService.isAuthenticated();
        const storedAdmin = adminAuthService.getStoredAdmin();

        // Not authenticated at all - redirect to admin login
        if (!isAdminAuthenticated || !storedAdmin) {
            return <Navigate to="/login" replace />;
        }

        // Allow Admin (role_id=1) and Cashier (role_id=2) to access cashier POS
        if (storedAdmin.role_id !== 1 && storedAdmin.role_id !== 2) {
            return <Navigate to="/login" replace />;
        }

        return children;
    }

    // If admin route is required
    if (requireAdmin) {
        // Check if admin is authenticated via cookies
        const isAdminAuthenticated = adminAuthService.isAuthenticated();
        const storedAdmin = adminAuthService.getStoredAdmin();

        // Not authenticated at all - redirect to admin login
        if (!isAdminAuthenticated || !storedAdmin) {
            return <Navigate to="/login" replace />;
        }

        // Allow Admin (role_id=1) and Staff (role_id=3) to access admin dashboard
        // Cashier (role_id=2) should use /cashier route
        if (storedAdmin.role_id !== 1 && storedAdmin.role_id !== 3) {
            return <Navigate to="/admin/login" replace />;
        }

        // Admin or Staff is authenticated and has correct role
        return children;
    }

    // For non-admin protected routes (if any)
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

export default ProtectedRoute;

