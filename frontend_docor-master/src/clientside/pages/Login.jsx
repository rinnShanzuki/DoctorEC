import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import "./Login.css";
import logo from "../../assets/logo.jpg";
import coverImage from "../../assets/cover-nobg.png";
import { FaEnvelope, FaLock, FaArrowRight, FaArrowLeft, FaShieldAlt, FaRedo } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";

import { useAuth } from "../../context/AuthContext";
import clientAuthService from "../../services/clientAuthService";

function Login() {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState(location.state?.message || "");
    const [loading, setLoading] = useState(false);

    // OTP verification state (for unverified accounts)
    const [showOtp, setShowOtp] = useState(false);
    const [otpEmail, setOtpEmail] = useState("");
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [resendTimer, setResendTimer] = useState(0);
    const otpRefs = useRef([]);

    // Clear success message when user starts typing
    useEffect(() => {
        if (successMessage && (email || password)) {
            setSuccessMessage("");
        }
    }, [email, password, successMessage]);

    // Hide chatbot on this page
    useEffect(() => {
        const chatbot = document.querySelector('.chatbot-container');
        if (chatbot) {
            chatbot.style.display = 'none';
        }

        // Show chatbot when leaving the page
        return () => {
            const chatbot = document.querySelector('.chatbot-container');
            if (chatbot) {
                chatbot.style.display = 'block';
            }
        };
    }, []);

    // Resend countdown timer
    useEffect(() => {
        if (resendTimer > 0) {
            const interval = setInterval(() => setResendTimer(prev => prev - 1), 1000);
            return () => clearInterval(interval);
        }
    }, [resendTimer]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccessMessage("");
        setLoading(true);
        try {
            const result = await login(email, password);

            // Handle unverified email — show OTP prompt
            if (result.needsVerification) {
                setOtpEmail(result.email || email);
                setShowOtp(true);
                setSuccessMessage(result.message || "Please verify your email. A verification code has been sent.");
                setResendTimer(60);
                setLoading(false);
                return;
            }

            if (result.success) {
                // Redirect based on user type and role
                if (result.user_type === 'doctor') {
                    window.location.href = "/doctor";
                } else if (result.user_type === 'admin') {
                    switch (result.role_id) {
                        case 1: // Admin - Full access
                            window.location.href = "/admin/dashboard";
                            break;
                        case 2: // Cashier - POS only
                            window.location.href = "/cashier";
                            break;
                        case 3: // Staff - Appointments
                            window.location.href = "/admin/dashboard/appointments";
                            break;
                        default:
                            window.location.href = "/admin/dashboard";
                    }
                } else {
                    // Client user
                    navigate("/home");
                }
            } else {
                setError(result.message || "Authentication failed");
            }
        } catch (err) {
            console.error(err);
            setError("An unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    };

    // OTP handlers
    const handleOtpChange = (index, value) => {
        if (!/^\d*$/.test(value)) return;
        const newOtp = [...otp];
        newOtp[index] = value.slice(-1);
        setOtp(newOtp);
        if (value && index < 5) {
            otpRefs.current[index + 1]?.focus();
        }
    };

    const handleOtpKeyDown = (index, e) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
    };

    const handleOtpPaste = (e) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
        const newOtp = [...otp];
        for (let i = 0; i < 6; i++) {
            newOtp[i] = pasted[i] || "";
        }
        setOtp(newOtp);
        if (pasted.length > 0) {
            otpRefs.current[Math.min(pasted.length, 5)]?.focus();
        }
    };

    const handleVerifyOtp = async () => {
        const code = otp.join("");
        if (code.length !== 6) {
            setError("Please enter the complete 6-digit code.");
            return;
        }

        setLoading(true);
        setError("");
        setSuccessMessage("");

        try {
            const response = await clientAuthService.verifyEmailOtp(otpEmail, code);
            if (response.status === "success") {
                setSuccessMessage("Email verified successfully! Redirecting...");
                setTimeout(() => {
                    navigate("/");
                    window.location.reload();
                }, 1500);
            } else {
                setError(response.message || "Verification failed.");
            }
        } catch (err) {
            setError(err.message || "Invalid or expired verification code.");
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        if (resendTimer > 0) return;
        setLoading(true);
        setError("");
        try {
            const response = await clientAuthService.resendEmailOtp(otpEmail);
            setSuccessMessage(response.message || "New verification code sent!");
            setResendTimer(60);
            setOtp(["", "", "", "", "", ""]);
        } catch (err) {
            setError(err.message || "Failed to resend code.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <Link to="/" className="back-to-home">
                <FaArrowLeft /> Home
            </Link>

            <img src={coverImage} alt="Doctor EC Optical Clinic" className="auth-cover-image" />

            <div className="auth-container">
                {/* LEFT SIDE */}
                <div className="auth-left">
                    <img src={logo} alt="Clinic Logo" className="auth-logo" />
                    <h1>Doctor EC Optical Clinic</h1>
                    <p>Your Vision, Our Focus.</p>
                </div>

                {/* RIGHT SIDE */}
                <div className="auth-right">
                    {showOtp ? (
                        /* ============ OTP VERIFICATION STEP ============ */
                        <>
                            <h2>Verify Your Email</h2>
                            <p style={{ textAlign: 'center', color: '#5D4C3D', fontSize: '0.95rem', marginBottom: '20px', lineHeight: '1.6' }}>
                                We've sent a 6-digit code to<br />
                                <strong style={{ color: '#3B2F2B' }}>{otpEmail}</strong>
                            </p>

                            {error && <div className="error-message">{error}</div>}
                            {successMessage && <div style={{ color: '#2E7D32', fontSize: '0.9rem', textAlign: 'center', marginBottom: '15px', padding: '12px', background: 'rgba(46,125,50,0.1)', borderRadius: '8px', border: '1px solid rgba(46,125,50,0.2)' }}>{successMessage}</div>}

                            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', margin: '20px 0 25px' }} onPaste={handleOtpPaste}>
                                {otp.map((digit, idx) => (
                                    <input
                                        key={idx}
                                        ref={(el) => (otpRefs.current[idx] = el)}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={1}
                                        value={digit}
                                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                                        autoFocus={idx === 0}
                                        style={{
                                            width: '48px', height: '56px', textAlign: 'center',
                                            fontSize: '1.5rem', fontWeight: 700, color: '#3B2F2B',
                                            borderWidth: '2px', borderStyle: 'solid',
                                            borderColor: digit ? '#8B6F55' : '#E8D7C9',
                                            borderRadius: '12px',
                                            background: digit ? '#FBF7F3' : '#FFFDFB',
                                            transition: 'all 0.3s ease', outline: 'none',
                                        }}
                                        onFocus={(e) => { e.target.style.borderColor = '#8B6F55'; e.target.style.boxShadow = '0 0 0 3px rgba(139,111,85,0.15)'; }}
                                        onBlur={(e) => { e.target.style.borderColor = digit ? '#8B6F55' : '#E8D7C9'; e.target.style.boxShadow = 'none'; }}
                                    />
                                ))}
                            </div>

                            <button
                                type="button"
                                className="auth-btn"
                                onClick={handleVerifyOtp}
                                disabled={loading || otp.join("").length !== 6}
                            >
                                {loading ? "Verifying..." : "Verify Email"}
                                <FaShieldAlt className="btn-icon" />
                            </button>

                            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '15px' }}>
                                <button
                                    type="button"
                                    onClick={handleResendOtp}
                                    disabled={resendTimer > 0 || loading}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '6px',
                                        background: 'none', border: 'none',
                                        color: resendTimer > 0 ? '#A89B8C' : '#8B6F55',
                                        fontSize: '0.9rem', fontWeight: 600,
                                        cursor: resendTimer > 0 ? 'not-allowed' : 'pointer',
                                        padding: '8px 16px', borderRadius: '8px',
                                    }}
                                >
                                    <FaRedo />
                                    {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend Code"}
                                </button>
                            </div>

                            <p className="switch-mode" style={{ marginTop: '20px' }}>
                                <span onClick={() => { setShowOtp(false); setError(""); setSuccessMessage(""); }} style={{ cursor: 'pointer', color: '#8B6F55', fontWeight: 600 }}>
                                    ← Back to Login
                                </span>
                            </p>
                        </>
                    ) : (
                        /* ============ LOGIN FORM ============ */
                        <>
                    <h2>Welcome Back!</h2>
                    {successMessage && <div className="success-message">{successMessage}</div>}
                    {error && <div className="error-message">{error}</div>}
                    <form onSubmit={handleSubmit}>
                        <div className="input-group">
                            <div className="input-wrapper">
                                <input
                                    type="email"
                                    placeholder="Email Address"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="auth-input"
                                />
                                <FaEnvelope className="input-icon" />
                            </div>
                        </div>
                        <div className="input-group">
                            <div className="input-wrapper">
                                <input
                                    type="password"
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="auth-input"
                                />
                                <FaLock className="input-icon" />
                            </div>
                        </div>
                        <button type="submit" className="auth-btn" disabled={loading}>
                            {loading ? "Processing..." : "Login"}
                            <FaArrowRight className="btn-icon" />
                        </button>
                        <div style={{ textAlign: 'right', marginTop: '10px' }}>
                            <Link to="/forgot-password" style={{ color: '#5D4E37', fontSize: '13px', textDecoration: 'none' }}>
                                Forgot Password?
                            </Link>
                        </div>
                    </form>

                    <div className="or-divider">OR</div>

                    <a href="http://localhost:8000/api/v1/auth/google/redirect" className="google-btn">
                        <FcGoogle size={20} />
                        Sign in with Google
                    </a>
                    <p className="switch-mode">
                        Don't have an account? <Link to="/signup">Register</Link>
                    </p>
                        </>
                    )}
                </div>
            </div>

            <footer className="auth-footer">
                © 2025 Doctor EC Optical Clinic. All rights reserved.
            </footer>
        </div>
    );
}

export default Login;
