import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaEnvelope, FaArrowLeft, FaLock, FaCheck } from 'react-icons/fa';
import axios from 'axios';
import API_CONFIG from '../../config/api.config';

/**
 * Forgot Password Page (REQ004)
 * Email-based password recovery with real backend integration
 */
const ForgotPassword = () => {
    const [step, setStep] = useState(1); // 1: Enter email, 2: Enter OTP, 3: New password, 4: Success
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [resetToken, setResetToken] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [debugOtp, setDebugOtp] = useState(''); // For development only

    const api = axios.create({
        baseURL: API_CONFIG.BASE_URL,
        headers: { 'Content-Type': 'application/json' }
    });

    // Step 1: Send OTP to email
    const handleSendOtp = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await api.post('/password/send-reset-email', { email });

            if (response.data.status === 'success') {
                setStep(2);
                // Show debug OTP in development
                if (response.data.debug_otp) {
                    setDebugOtp(response.data.debug_otp);
                }
            } else {
                setError(response.data.message || 'Failed to send verification code');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send verification code. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Verify OTP
    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await api.post('/password/verify-otp', { email, otp });

            if (response.data.status === 'success') {
                setResetToken(response.data.reset_token);
                setStep(3);
            } else {
                setError(response.data.message || 'Invalid verification code');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid or expired verification code.');
        } finally {
            setLoading(false);
        }
    };

    // Step 3: Reset password
    const handleResetPassword = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (newPassword.length < 8) {
            setError('Password must be at least 8 characters');
            setLoading(false);
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        try {
            const response = await api.post('/password/reset', {
                email,
                reset_token: resetToken,
                password: newPassword,
                password_confirmation: confirmPassword
            });

            if (response.data.status === 'success') {
                setStep(4);
            } else {
                setError(response.data.message || 'Failed to reset password');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to reset password. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Resend OTP
    const handleResendOtp = async () => {
        setOtp('');
        setDebugOtp('');
        await handleSendOtp({ preventDefault: () => { } });
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#F5F1EE',
            position: 'relative',
            zIndex: 1
        }}>
            <div style={{
                maxWidth: '450px',
                width: '90%',
                padding: '40px',
                backgroundColor: 'white',
                borderRadius: '16px',
                boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                position: 'relative',
                zIndex: 100
            }}>

                {/* Step 1: Enter Email */}
                {step === 1 && (
                    <form onSubmit={handleSendOtp}>
                        <Link to="/login" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#5D4E37', textDecoration: 'none', marginBottom: '20px', fontSize: '14px', fontFamily: 'Calibri' }}>
                            <FaArrowLeft /> Back to Login
                        </Link>

                        <div style={{ textAlign: 'center', marginBottom: '25px' }}>
                            <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#E3F2FD', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px' }}>
                                <FaEnvelope style={{ color: '#1976D2', fontSize: '24px' }} />
                            </div>
                            <h2 style={{ color: '#5D4E37', marginBottom: '8px', fontFamily: 'Calibri' }}>Forgot Password?</h2>
                            <p style={{ color: '#666', fontSize: '14px', fontFamily: 'Calibri' }}>
                                Enter your email and we'll send you a verification code
                            </p>
                        </div>

                        {error && (
                            <div style={{ backgroundColor: '#FFEBEE', color: '#C62828', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px', fontFamily: 'Calibri' }}>
                                {error}
                            </div>
                        )}

                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email address"
                            required
                            style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid #E0D5C7', fontSize: '15px', fontFamily: 'Calibri', marginBottom: '20px', boxSizing: 'border-box' }}
                        />

                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                width: '100%',
                                padding: '14px',
                                borderRadius: '10px',
                                border: 'none',
                                backgroundColor: loading ? '#8B7355' : '#5D4E37',
                                color: 'white',
                                fontSize: '15px',
                                fontWeight: 600,
                                cursor: loading ? 'not-allowed' : 'pointer',
                                fontFamily: 'Calibri'
                            }}
                        >
                            {loading ? 'Sending...' : 'Send Verification Code'}
                        </button>
                    </form>
                )}

                {/* Step 2: Enter OTP */}
                {step === 2 && (
                    <form onSubmit={handleVerifyOtp}>
                        <button type="button" onClick={() => setStep(1)} style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', color: '#5D4E37', cursor: 'pointer', marginBottom: '20px', fontSize: '14px', fontFamily: 'Calibri', padding: 0 }}>
                            <FaArrowLeft /> Back
                        </button>

                        <div style={{ textAlign: 'center', marginBottom: '25px' }}>
                            <h2 style={{ color: '#5D4E37', marginBottom: '8px', fontFamily: 'Calibri' }}>Verify Your Email</h2>
                            <p style={{ color: '#666', fontSize: '14px', fontFamily: 'Calibri' }}>
                                Enter the 6-digit code sent to <strong>{email}</strong>
                            </p>
                        </div>

                        {error && (
                            <div style={{ backgroundColor: '#FFEBEE', color: '#C62828', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px', fontFamily: 'Calibri' }}>
                                {error}
                            </div>
                        )}

                        {debugOtp && (
                            <div style={{ backgroundColor: '#E3F2FD', color: '#1565C0', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '13px', fontFamily: 'Calibri' }}>
                                🔧 <strong>Debug Mode:</strong> Your OTP is <strong>{debugOtp}</strong>
                            </div>
                        )}

                        <input
                            type="text"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            placeholder="Enter 6-digit code"
                            maxLength={6}
                            required
                            style={{ width: '100%', padding: '16px', borderRadius: '10px', border: '1px solid #E0D5C7', fontSize: '24px', fontFamily: 'Calibri', marginBottom: '20px', textAlign: 'center', letterSpacing: '10px', boxSizing: 'border-box' }}
                        />

                        <button
                            type="submit"
                            disabled={loading || otp.length !== 6}
                            style={{
                                width: '100%',
                                padding: '14px',
                                borderRadius: '10px',
                                border: 'none',
                                backgroundColor: (loading || otp.length !== 6) ? '#C4B8A5' : '#5D4E37',
                                color: 'white',
                                fontSize: '15px',
                                fontWeight: 600,
                                cursor: (loading || otp.length !== 6) ? 'not-allowed' : 'pointer',
                                fontFamily: 'Calibri'
                            }}
                        >
                            {loading ? 'Verifying...' : 'Verify Code'}
                        </button>

                        <button
                            type="button"
                            onClick={handleResendOtp}
                            disabled={loading}
                            style={{ width: '100%', marginTop: '15px', padding: '12px', background: 'none', border: '1px solid #E0D5C7', borderRadius: '10px', color: '#5D4E37', cursor: 'pointer', fontFamily: 'Calibri', fontSize: '14px' }}
                        >
                            Didn't receive code? Resend
                        </button>
                    </form>
                )}

                {/* Step 3: New Password */}
                {step === 3 && (
                    <form onSubmit={handleResetPassword}>
                        <div style={{ textAlign: 'center', marginBottom: '25px' }}>
                            <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#E8F5E9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px' }}>
                                <FaLock style={{ color: '#388E3C', fontSize: '24px' }} />
                            </div>
                            <h2 style={{ color: '#5D4E37', marginBottom: '8px', fontFamily: 'Calibri' }}>Create New Password</h2>
                            <p style={{ color: '#666', fontSize: '14px', fontFamily: 'Calibri' }}>
                                Your new password must be at least 8 characters
                            </p>
                        </div>

                        {error && (
                            <div style={{ backgroundColor: '#FFEBEE', color: '#C62828', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px', fontFamily: 'Calibri' }}>
                                {error}
                            </div>
                        )}

                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="New password"
                            required
                            style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid #E0D5C7', fontSize: '15px', fontFamily: 'Calibri', marginBottom: '15px', boxSizing: 'border-box' }}
                        />

                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm new password"
                            required
                            style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid #E0D5C7', fontSize: '15px', fontFamily: 'Calibri', marginBottom: '20px', boxSizing: 'border-box' }}
                        />

                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                width: '100%',
                                padding: '14px',
                                borderRadius: '10px',
                                border: 'none',
                                backgroundColor: loading ? '#8B7355' : '#5D4E37',
                                color: 'white',
                                fontSize: '15px',
                                fontWeight: 600,
                                cursor: loading ? 'not-allowed' : 'pointer',
                                fontFamily: 'Calibri'
                            }}
                        >
                            {loading ? 'Resetting...' : 'Reset Password'}
                        </button>
                    </form>
                )}

                {/* Step 4: Success */}
                {step === 4 && (
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#E8F5E9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                            <FaCheck style={{ color: '#388E3C', fontSize: '36px' }} />
                        </div>
                        <h2 style={{ color: '#5D4E37', marginBottom: '10px', fontFamily: 'Calibri' }}>Password Reset!</h2>
                        <p style={{ color: '#666', marginBottom: '25px', fontSize: '14px', fontFamily: 'Calibri' }}>
                            Your password has been successfully reset. You can now log in with your new password.
                        </p>
                        <Link
                            to="/login"
                            style={{
                                display: 'inline-block',
                                padding: '14px 30px',
                                borderRadius: '10px',
                                backgroundColor: '#5D4E37',
                                color: 'white',
                                textDecoration: 'none',
                                fontSize: '15px',
                                fontWeight: 600,
                                fontFamily: 'Calibri'
                            }}
                        >
                            Go to Login
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ForgotPassword;
