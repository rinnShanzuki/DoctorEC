import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./SignUp.css";
import logo from "../../assets/logo.jpg";
import coverImage from "../../assets/cover-nobg.png";
import { FaUser, FaEnvelope, FaLock, FaArrowRight, FaArrowLeft, FaShieldAlt, FaRedo } from 'react-icons/fa';
import { useAuth } from "../../context/AuthContext";
import clientAuthService from "../../services/clientAuthService";

const SignUp = () => {
    const navigate = useNavigate();
    const { signup } = useAuth();
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [phone, setPhone] = useState("");
    const [gender, setGender] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);

    // OTP verification state
    const [showOtp, setShowOtp] = useState(false);
    const [otpEmail, setOtpEmail] = useState("");
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [resendTimer, setResendTimer] = useState(0);
    const otpRefs = useRef([]);

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
        setSuccess("");

        if (password !== confirmPassword) {
            setError("Passwords do not match!");
            return;
        }

        setLoading(true);
        try {
            const result = await signup({
                first_name: firstName,
                last_name: lastName,
                email,
                password,
                confirmPassword,
                phone,
                gender
            });

            // Check if email verification is needed
            if (result.needsVerification) {
                setOtpEmail(result.email || email);
                setShowOtp(true);
                setSuccess(result.message || "Please check your email for the verification code.");
                setResendTimer(60);
                setLoading(false);
                return;
            }

            if (result.success) {
                navigate("/login", { state: { message: "Registration successful! Please log in." } });
            } else {
                setError(result.message || "Registration failed");
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
        setSuccess("");

        try {
            const response = await clientAuthService.verifyEmailOtp(otpEmail, code);
            if (response.status === "success") {
                setSuccess("Email verified successfully! Redirecting...");
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
            setSuccess(response.message || "New verification code sent!");
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
                            {success && <div style={{ color: '#2E7D32', fontSize: '0.9rem', textAlign: 'center', marginBottom: '15px', padding: '12px', background: 'rgba(46,125,50,0.1)', borderRadius: '8px', border: '1px solid rgba(46,125,50,0.2)' }}>{success}</div>}

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
                                            width: '48px',
                                            height: '56px',
                                            textAlign: 'center',
                                            fontSize: '1.5rem',
                                            fontWeight: 700,
                                            color: '#3B2F2B',
                                            border: `2px solid ${digit ? '#8B6F55' : '#E8D7C9'}`,
                                            borderRadius: '12px',
                                            background: digit ? '#FBF7F3' : '#FFFDFB',
                                            transition: 'all 0.3s ease',
                                            outline: 'none',
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
                                <span onClick={() => { setShowOtp(false); setError(""); setSuccess(""); }} style={{ cursor: 'pointer', color: '#8B6F55', fontWeight: 600 }}>
                                    ← Back to Register
                                </span>
                            </p>
                        </>
                    ) : (
                        /* ============ REGISTER FORM ============ */
                        <>
                            <h2>Create an Account</h2>
                            {error && <div className="error-message">{error}</div>}
                            <form onSubmit={handleSubmit}>
                                <div className="input-group">
                                    <div className="input-wrapper">
                                        <input type="text" placeholder="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required className="auth-input" />
                                        <FaUser className="input-icon" />
                                    </div>
                                </div>

                                <div className="input-group">
                                    <div className="input-wrapper">
                                        <input type="text" placeholder="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} required className="auth-input" />
                                        <FaUser className="input-icon" />
                                    </div>
                                </div>

                                <div className="input-group">
                                    <div className="input-wrapper">
                                        <input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} required className="auth-input" />
                                        <FaEnvelope className="input-icon" />
                                    </div>
                                </div>

                                <div className="input-group">
                                    <div className="input-wrapper">
                                        <input type="tel" placeholder="Phone Number (Optional)" value={phone} onChange={(e) => setPhone(e.target.value)} className="auth-input" />
                                        <FaEnvelope className="input-icon" />
                                    </div>
                                </div>

                                <div className="input-group">
                                    <div className="input-wrapper">
                                        <select value={gender} onChange={(e) => setGender(e.target.value)} className="auth-input" style={{ paddingRight: '40px' }}>
                                            <option value="">Select Gender (Optional)</option>
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                            <option value="other">Other</option>
                                        </select>
                                        <FaUser className="input-icon" />
                                    </div>
                                </div>

                                <div className="input-group">
                                    <div className="input-wrapper">
                                        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required className="auth-input" />
                                        <FaLock className="input-icon" />
                                    </div>
                                </div>

                                <div className="input-group">
                                    <div className="input-wrapper">
                                        <input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="auth-input" />
                                        <FaLock className="input-icon" />
                                    </div>
                                </div>

                                <button type="submit" className="auth-btn" disabled={loading}>
                                    {loading ? "Processing..." : "Register"}
                                    <FaArrowRight className="btn-icon" />
                                </button>
                            </form>

                            <p className="switch-mode">
                                Already have an account?{" "}
                                <Link to="/login">Login</Link>
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
};

export default SignUp;
