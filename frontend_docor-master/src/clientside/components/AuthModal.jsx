import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./AuthModal.css";
import logo from "../../assets/logo.jpg";
import { FaTimes, FaUser, FaEnvelope, FaLock, FaArrowRight, FaShieldAlt, FaRedo } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import { useModal } from "../../context/ModalContext";
import clientAuthService from "../../services/clientAuthService";

const AuthModal = ({ isOpen, onClose, initialMode = "login" }) => {
    const navigate = useNavigate();
    const { login, signup } = useAuth();
    const { openAuth } = useModal();

    const [isRegister, setIsRegister] = useState(initialMode === "register");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);

    // OTP verification state
    const [showOtp, setShowOtp] = useState(false);
    const [otpEmail, setOtpEmail] = useState("");
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [resendTimer, setResendTimer] = useState(0);
    const otpRefs = useRef([]);

    useEffect(() => {
        if (isOpen) {
            setIsRegister(initialMode === "register");
            setName("");
            setEmail("");
            setPassword("");
            setConfirmPassword("");
            setError("");
            setSuccess("");
            setShowOtp(false);
            setOtp(["", "", "", "", "", ""]);
        }
    }, [isOpen, initialMode]);

    // Resend countdown timer
    useEffect(() => {
        if (resendTimer > 0) {
            const interval = setInterval(() => setResendTimer(prev => prev - 1), 1000);
            return () => clearInterval(interval);
        }
    }, [resendTimer]);

    const toggleMode = () => {
        setIsRegister(!isRegister);
        setError("");
        setSuccess("");
        setShowOtp(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (isRegister && password !== confirmPassword) {
            setError("Passwords do not match!");
            return;
        }

        setLoading(true);
        try {
            let result;
            if (isRegister) {
                result = await signup({ name, email, password, confirmPassword });
            } else {
                result = await login(email, password);
            }

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
                onClose();
                if (result.user?.role === "admin") {
                    navigate("/admin");
                } else {
                    navigate("/");
                }
            } else {
                setError(result.message || "Authentication failed");
            }
        } catch (err) {
            console.error(err);
            // Handle email verification needed from login
            if (err.email_verified === false) {
                setOtpEmail(email);
                setShowOtp(true);
                setSuccess(err.message || "Please verify your email first.");
                setResendTimer(60);
            } else {
                setError("An unexpected error occurred.");
            }
        } finally {
            setLoading(false);
        }
    };

    // Handle OTP digit input
    const handleOtpChange = (index, value) => {
        if (!/^\d*$/.test(value)) return; // Only digits

        const newOtp = [...otp];
        newOtp[index] = value.slice(-1); // Only last digit
        setOtp(newOtp);

        // Auto-focus next input
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
            const focusIdx = Math.min(pasted.length, 5);
            otpRefs.current[focusIdx]?.focus();
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
                    onClose();
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

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="auth-box" onClick={(e) => e.stopPropagation()}>
                <button className="close-btn" onClick={onClose}>
                    <FaTimes />
                </button>

                <div className="auth-content">
                    {/* LEFT SIDE */}
                    <div className="auth-left">
                        <img src={logo} alt="Clinic Logo" className="auth-logo" />
                        <h1>Doctor EC Optical Clinic</h1>
                        <p>Your Vision, Our Focus.</p>
                        {showOtp ? (
                            <div className="auth-features">
                                <div className="feature"><FaShieldAlt /> Secure Verification</div>
                                <div className="feature"><FaEnvelope /> Check Your Email</div>
                                <div className="feature">✅ Almost Done!</div>
                            </div>
                        ) : isRegister ? (
                            <div className="auth-features">
                                <div className="feature"><i className="fas fa-check"></i> Easy Appointments</div>
                                <div className="feature"><i className="fas fa-check"></i> Track History</div>
                                <div className="feature"><i className="fas fa-check"></i> Exclusive Offers</div>
                            </div>
                        ) : null}
                    </div>

                    {/* RIGHT SIDE */}
                    <div className="auth-right">
                        {showOtp ? (
                            /* ============ OTP VERIFICATION STEP ============ */
                            <>
                                <h2>Verify Your Email</h2>
                                <p className="otp-subtitle">
                                    We've sent a 6-digit code to<br />
                                    <strong>{otpEmail}</strong>
                                </p>

                                {error && <div className="error-msg">{error}</div>}
                                {success && <div className="success-msg">{success}</div>}

                                <div className="otp-container" onPaste={handleOtpPaste}>
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
                                            className={`otp-input ${digit ? "otp-filled" : ""}`}
                                            autoFocus={idx === 0}
                                        />
                                    ))}
                                </div>

                                <button
                                    type="button"
                                    className="login-btn"
                                    onClick={handleVerifyOtp}
                                    disabled={loading || otp.join("").length !== 6}
                                >
                                    {loading ? "Verifying..." : "Verify Email"}
                                    <FaShieldAlt className="btn-icon" />
                                </button>

                                <div className="otp-actions">
                                    <button
                                        type="button"
                                        className="resend-btn"
                                        onClick={handleResendOtp}
                                        disabled={resendTimer > 0 || loading}
                                    >
                                        <FaRedo />
                                        {resendTimer > 0
                                            ? `Resend in ${resendTimer}s`
                                            : "Resend Code"}
                                    </button>
                                </div>

                                <p className="switch-mode">
                                    <span onClick={() => { setShowOtp(false); setError(""); setSuccess(""); }}>
                                        ← Back to {isRegister ? "Register" : "Login"}
                                    </span>
                                </p>
                            </>
                        ) : (
                            /* ============ LOGIN / REGISTER FORM ============ */
                            <>
                                <h2>{isRegister ? "Create an Account" : "Welcome Back!"}</h2>
                                {error && <div className="error-msg">{error}</div>}

                                <form onSubmit={handleSubmit}>
                                    {isRegister && (
                                        <div className="input-group">
                                            <div className="input-wrapper">
                                                <input
                                                    type="text"
                                                    placeholder="Full Name"
                                                    value={name}
                                                    onChange={(e) => setName(e.target.value)}
                                                    required
                                                    className="auth-input"
                                                />
                                                <FaUser className="input-icon" />
                                            </div>
                                        </div>
                                    )}

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

                                    {isRegister && (
                                        <div className="input-group">
                                            <div className="input-wrapper">
                                                <input
                                                    type="password"
                                                    placeholder="Confirm Password"
                                                    value={confirmPassword}
                                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                                    required
                                                    className="auth-input"
                                                />
                                                <FaLock className="input-icon" />
                                            </div>
                                        </div>
                                    )}

                                    <button type="submit" className="login-btn" disabled={loading}>
                                        {loading ? "Processing..." : (isRegister ? "Register" : "Login")}
                                        <FaArrowRight className="btn-icon" />
                                    </button>
                                </form>

                                <p className="switch-mode">
                                    {isRegister ? (
                                        <>
                                            Already have an account? <span onClick={toggleMode}>Login</span>
                                        </>
                                    ) : (
                                        <>
                                            Don't have an account? <span onClick={toggleMode}>Register</span>
                                        </>
                                    )}
                                </p>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthModal;
