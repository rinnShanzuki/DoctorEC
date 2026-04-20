import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FaCheckCircle } from 'react-icons/fa';

function LoginSuccess() {
    const navigate = useNavigate();
    const { user, loading } = useAuth();
    const [redirecting, setRedirecting] = useState(false);

    useEffect(() => {
        if (!loading && user && !redirecting) {
            setRedirecting(true);
            // Show the success modal for 2 seconds, then redirect to home
            setTimeout(() => {
                navigate('/home', { replace: true });
            }, 2000);
        } else if (!loading && !user && !redirecting) {
            // Use a short delay before deciding it failed, just in case
            setTimeout(() => {
                navigate('/login?error=Authentication failed', { replace: true });
            }, 3000);
        }
    }, [user, loading, navigate, redirecting]);

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            backgroundColor: '#f0f4f8',
            fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
            <div style={{
                backgroundColor: 'white',
                padding: '40px',
                borderRadius: '16px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                textAlign: 'center',
                maxWidth: '400px',
                width: '90%',
                animation: 'fadeIn 0.5s ease-out'
            }}>
                {loading || (!redirecting && !user) ? (
                    <div>
                        <div style={{
                            border: '4px solid #f3f3f3',
                            borderTop: '4px solid #5D4E37',
                            borderRadius: '50%',
                            width: '40px',
                            height: '40px',
                            animation: 'spin 1s linear infinite',
                            margin: '0 auto 20px auto'
                        }}></div>
                        <h2 style={{ color: '#333', marginBottom: '10px' }}>Verifying Authentication...</h2>
                    </div>
                ) : user ? (
                    <div>
                        <FaCheckCircle style={{ color: '#4CAF50', fontSize: '72px', marginBottom: '20px' }} />
                        <h2 style={{ color: '#333', marginBottom: '10px' }}>Login Successful!</h2>
                        <p style={{ color: '#666', lineHeight: '1.5' }}>
                            Welcome back, {user.first_name || 'User'}! Redirecting you to your dashboard...
                        </p>
                    </div>
                ) : (
                    <div>
                        <h2 style={{ color: '#e53935', marginBottom: '10px' }}>Authentication Failed</h2>
                        <p style={{ color: '#666' }}>Redirecting you back to login...</p>
                    </div>
                )}
            </div>

            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}

export default LoginSuccess;
