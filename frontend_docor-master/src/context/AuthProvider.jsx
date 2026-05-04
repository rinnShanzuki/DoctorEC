import React, { useState, useEffect, useCallback, useRef } from 'react';
import Cookies from 'js-cookie';
import adminAuthService from '../services/adminAuthService';
import clientAuthService from '../services/clientAuthService';
import doctorAuthService from '../services/doctorAuthService';
import AuthContext from './AuthContext';

// Session timeout settings (in milliseconds)
const IDLE_TIMEOUT = 10 * 60 * 1000; // 10 minutes
const WARNING_TIME = 1 * 60 * 1000;  // Show warning 1 minute before logout

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);
    const [timeLeft, setTimeLeft] = useState(60);

    const idleTimerRef = useRef(null);
    const warningTimerRef = useRef(null);
    const countdownRef = useRef(null);

    // Reset idle timer on user activity
    const resetIdleTimer = useCallback(() => {
        // Only track if user is logged in
        if (!user) return;

        // Clear existing timers
        if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
        if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
        if (countdownRef.current) clearInterval(countdownRef.current);

        // Hide warning if shown
        setShowTimeoutWarning(false);
        setTimeLeft(60);

        // Set warning timer (9 minutes)
        warningTimerRef.current = setTimeout(() => {
            setShowTimeoutWarning(true);
            setTimeLeft(60);

            // Start countdown
            countdownRef.current = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(countdownRef.current);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }, IDLE_TIMEOUT - WARNING_TIME);

        // Set logout timer (10 minutes)
        idleTimerRef.current = setTimeout(() => {
            handleIdleLogout();
        }, IDLE_TIMEOUT);
    }, [user]);

    // Handle logout due to inactivity
    const handleIdleLogout = useCallback(async () => {
        setShowTimeoutWarning(false);
        if (countdownRef.current) clearInterval(countdownRef.current);

        try {
            if (clientAuthService.isAuthenticated()) {
                await clientAuthService.logout();
            } else if (adminAuthService.isAuthenticated()) {
                await adminAuthService.logout();
            } else if (doctorAuthService.isAuthenticated()) {
                await doctorAuthService.logout();
            }
        } catch (error) {
            console.error('Idle logout error:', error);
        } finally {
            setUser(null);
            // Redirect to appropriate login page
            const currentPath = window.location.pathname;
            if (currentPath.startsWith('/admin') || currentPath.startsWith('/cashier')) {
                window.location.href = '/admin/login';
            } else if (currentPath.startsWith('/doctor')) {
                window.location.href = '/login';
            } else {
                window.location.href = '/login';
            }
        }
    }, []);

    // Extend session (when user clicks "Stay Logged In")
    const extendSession = useCallback(() => {
        resetIdleTimer();
    }, [resetIdleTimer]);

    // Setup activity listeners
    useEffect(() => {
        if (!user) return;

        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

        const handleActivity = () => {
            resetIdleTimer();
        };

        // Add event listeners
        events.forEach(event => {
            document.addEventListener(event, handleActivity, { passive: true });
        });

        // Start timer
        resetIdleTimer();

        // Cleanup
        return () => {
            events.forEach(event => {
                document.removeEventListener(event, handleActivity);
            });
            if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
            if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
            if (countdownRef.current) clearInterval(countdownRef.current);
        };
    }, [user, resetIdleTimer]);

    useEffect(() => {
        const initializeAuth = async () => {
            // Check for token in URL (from Google Login redirect)
            const urlParams = new URLSearchParams(window.location.search);
            const tokenFromUrl = urlParams.get('token');

            if (tokenFromUrl) {
                // Store token temporarily to allow getCurrentClient to use it
                Cookies.set('client_token', tokenFromUrl, { expires: 7 });
                
                // Clean up the URL
                const url = new URL(window.location.href);
                url.searchParams.delete('token');
                window.history.replaceState({}, document.title, url.pathname);
                
                try {
                    // Fetch user info from backend
                    const client = await clientAuthService.getCurrentClient();
                    if (client) {
                        clientAuthService.storeClient(client, tokenFromUrl);
                        setUser(client);
                        setLoading(false);
                        return; // Successfully authenticated
                    }
                } catch (error) {
                    console.error("Error fetching Google authenticated client:", error);
                }
            }

            // Fallback: Check for existing stored sessions
            const storedClient = clientAuthService.getStoredClient();
            const storedAdmin = adminAuthService.getStoredAdmin();
            const storedDoctor = doctorAuthService.getStoredDoctor();

            if (storedClient && clientAuthService.isAuthenticated()) {
                setUser(storedClient);
            } else if (storedAdmin && adminAuthService.isAuthenticated()) {
                setUser(storedAdmin);
            } else if (storedDoctor && doctorAuthService.isAuthenticated()) {
                setUser(storedDoctor);
            }
            setLoading(false);
        };

        initializeAuth();
    }, []);

    const login = async (email, password) => {
        try {
            // Use unified login endpoint that checks both tables
            const response = await clientAuthService.unifiedLogin(email, password);

            if (response.status === 'success' && response.data) {
                const { user_type, client, admin, doctor, token } = response.data;

                if (user_type === 'client' && client) {
                    // Ensure name field exists for profile display
                    const clientWithName = {
                        ...client,
                        name: client.name || `${client.first_name || ''} ${client.last_name || ''}`.trim()
                    };
                    // Store as client (uses client_token cookie)
                    clientAuthService.storeClient(clientWithName, token);
                    setUser(clientWithName);
                    return { success: true, user: clientWithName, user_type: 'client' };
                } else if (user_type === 'admin' && admin) {
                    // Add name field for AdminLayout compatibility
                    const adminWithName = {
                        ...admin,
                        name: `${admin.first_name || ''} ${admin.last_name || ''}`.trim()
                    };
                    // Store as admin (uses auth_token cookie) so ProtectedRoute works
                    Cookies.set('auth_token', token, { expires: 7 });
                    Cookies.set('user_data', JSON.stringify(adminWithName), { expires: 7 });
                    setUser(adminWithName);
                    return { success: true, user: adminWithName, user_type: 'admin', role_id: admin.role_id };
                } else if (user_type === 'doctor' && doctor) {
                    // Store as doctor (uses doctor_token cookie)
                    Cookies.set('doctor_token', token, { expires: 7 });
                    Cookies.set('doctor_data', JSON.stringify(doctor), { expires: 7 });
                    setUser(doctor);
                    return { success: true, user: doctor, user_type: 'doctor' };
                }
            }

            return { success: false, message: response.message || 'Login failed' };
        } catch (error) {
            console.error('Login error:', error);

            // Handle email not verified
            if (error.email_verified === false) {
                return {
                    success: false,
                    needsVerification: true,
                    email: email,
                    message: error.message
                };
            }

            if (error.errors) {
                const errorMessages = Object.values(error.errors).flat().join(', ');
                return { success: false, message: errorMessages };
            }

            return {
                success: false,
                message: error.message || 'Login failed. Please check your credentials.'
            };
        }
    };

    const adminLogin = async (email, password) => {
        try {
            const response = await adminAuthService.login(email, password);

            if (response.status === 'success' && response.data.admin) {
                const admin = response.data.admin;
                // Add name field for AdminLayout compatibility
                const adminWithName = {
                    ...admin,
                    name: `${admin.first_name || ''} ${admin.last_name || ''}`.trim()
                };
                // Store in cookies so session persists across page refreshes
                Cookies.set('auth_token', response.data.token, { expires: 7 });
                Cookies.set('user_data', JSON.stringify(adminWithName), { expires: 7 });
                setUser(adminWithName);
                return { success: true, user: adminWithName };
            }

            return { success: false, message: response.message };
        } catch (error) {
            console.error('Admin login error:', error);

            if (error.errors) {
                const errorMessages = Object.values(error.errors).flat().join(', ');
                return {
                    success: false,
                    message: errorMessages
                };
            }

            return {
                success: false,
                message: error.message || 'Login failed. Please check your credentials.'
            };
        }
    };

    const signup = async (userData) => {
        try {
            const response = await clientAuthService.register(userData);

            if (response.status === 'success') {
                // Check if email verification is needed
                if (response.email_verified === false) {
                    return {
                        success: true,
                        needsVerification: true,
                        email: userData.email,
                        message: response.message
                    };
                }

                // Auto-login after successful registration (if already verified)
                if (response.data?.client) {
                    setUser(response.data.client);
                }
                return { success: true };
            }

            return { success: false, message: response.message };
        } catch (error) {
            console.error('Signup error:', error);

            // Handle email not verified on login attempt
            if (error.email_verified === false) {
                return {
                    success: false,
                    needsVerification: true,
                    email: userData.email,
                    message: error.message
                };
            }

            // Handle validation errors
            if (error.errors) {
                const errorMessages = Object.values(error.errors).flat().join(', ');
                return {
                    success: false,
                    message: errorMessages
                };
            }

            return {
                success: false,
                message: error.message || 'Registration failed. Please try again.'
            };
        }
    };

    const adminSignup = async (userData) => {
        try {
            // Map the fields to match backend expectations
            const adminData = {
                email: userData.email,
                password: userData.password,
                password_confirmation: userData.confirmPassword,
                first_name: userData.name?.split(' ')[0] || userData.name,
                last_name: userData.name?.split(' ').slice(1).join(' ') || '',
                position: userData.position || 'Administrator'
            };

            const response = await adminAuthService.register(adminData);

            if (response.status === 'success') {
                // Don't auto-login for admin, redirect to login page
                return { success: true };
            }

            return { success: false, message: response.message };
        } catch (error) {
            console.error('Admin signup error:', error);

            // Handle validation errors
            if (error.errors) {
                const errorMessages = Object.values(error.errors).flat().join(', ');
                return {
                    success: false,
                    message: errorMessages
                };
            }

            return {
                success: false,
                message: error.message || 'Admin registration failed. Please try again.'
            };
        }
    };

    const logout = async () => {
        try {
            // Clear timers
            if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
            if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
            if (countdownRef.current) clearInterval(countdownRef.current);

            // Check which type of user is logged in and logout accordingly
            if (clientAuthService.isAuthenticated()) {
                await clientAuthService.logout();
            } else if (adminAuthService.isAuthenticated()) {
                await adminAuthService.logout();
            } else if (doctorAuthService.isAuthenticated()) {
                await doctorAuthService.logout();
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            setUser(null);
        }
    };

    const isAdmin = () => {
        return user?.role?.name === 'admin';
    };

    const value = {
        user,
        login,
        adminLogin,
        signup,
        adminSignup,
        logout,
        loading,
        isAdmin,
        extendSession // Expose for warning modal
    };

    return (
        <AuthContext.Provider value={value}>
            {children}

            {/* Session Timeout Warning Modal */}
            {showTimeoutWarning && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 99999
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '12px',
                        padding: '30px',
                        maxWidth: '400px',
                        textAlign: 'center',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
                        fontFamily: 'Calibri, sans-serif'
                    }}>
                        <div style={{ fontSize: '48px', marginBottom: '15px' }}>⏰</div>
                        <h3 style={{
                            color: '#5D4E37',
                            marginBottom: '10px',
                            fontSize: '1.2rem',
                            fontWeight: 700
                        }}>
                            Session Timeout Warning
                        </h3>
                        <p style={{
                            color: '#666',
                            marginBottom: '20px',
                            lineHeight: '1.5'
                        }}>
                            Your session will expire in <strong style={{ color: '#C62828', fontSize: '1.1rem' }}>{timeLeft}</strong> seconds due to inactivity.
                        </p>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                            <button
                                onClick={extendSession}
                                style={{
                                    padding: '12px 24px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    backgroundColor: '#5D4E37',
                                    color: 'white',
                                    cursor: 'pointer',
                                    fontWeight: 600,
                                    fontSize: '14px'
                                }}
                            >
                                Stay Logged In
                            </button>
                            <button
                                onClick={handleIdleLogout}
                                style={{
                                    padding: '12px 24px',
                                    borderRadius: '8px',
                                    border: '1px solid #5D4E37',
                                    backgroundColor: 'white',
                                    color: '#5D4E37',
                                    cursor: 'pointer',
                                    fontWeight: 600,
                                    fontSize: '14px'
                                }}
                            >
                                Logout Now
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthContext.Provider>
    );
};

export default AuthProvider;

