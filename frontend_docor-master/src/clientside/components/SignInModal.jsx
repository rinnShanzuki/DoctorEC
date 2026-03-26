


import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./SignInModal.css";
import logo from "../../assets/logo.jpg";
import { FaTimes, FaEnvelope, FaLock, FaArrowRight, FaShieldAlt, FaRedo } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import { useModal } from "../../context/ModalContext";
import clientAuthService from "../../services/clientAuthService";

function SignInModal({ isOpen, onClose, onSignInSuccess }) {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { openSignUp } = useModal();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      setEmail("");
      setPassword("");
      setError("");
      setSuccess("");
      setShowOtp(false);
      setOtp(["", "", "", "", "", ""]);
    }
  }, [isOpen]);

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
    setLoading(true);
    try {
      const result = await login(email, password);

      // Check if email verification is needed
      if (result.needsVerification) {
        setOtpEmail(result.email || email);
        setShowOtp(true);
        setSuccess(result.message || "Please verify your email first. A new code has been sent.");
        setResendTimer(60);
        setLoading(false);
        return;
      }

      if (result.success) {
        if (onSignInSuccess) onSignInSuccess(result.user);
        onClose();
        if (result.user.role === "admin") {
          navigate("/admin");
        } else {
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
    setSuccess("");

    try {
      const response = await clientAuthService.verifyEmailOtp(otpEmail, code);
      if (response.status === "success") {
        setSuccess("Email verified successfully! Redirecting...");
        setTimeout(() => {
          onClose();
          navigate("/home");
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
          <div className="auth-left">
            <img src={logo} alt="Clinic Logo" className="auth-logo" />
            <h1>Doctor EC Optical Clinic</h1>
            <p>Your Vision, Our Focus.</p>
            {showOtp && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '20px', width: '100%', position: 'relative', zIndex: 1 }}>
                <div className="feature" style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.15)', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                  <FaShieldAlt /> Secure Verification
                </div>
                <div className="feature" style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.15)', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                  <FaEnvelope /> Check Your Email
                </div>
              </div>
            )}
          </div>
          <div className="auth-right">
            {showOtp ? (
              /* ============ OTP VERIFICATION STEP ============ */
              <>
                <h2>Verify Your Email</h2>
                <p style={{ textAlign: 'center', color: '#5D4C3D', fontSize: '0.95rem', marginBottom: '20px', lineHeight: '1.6' }}>
                  We've sent a 6-digit code to<br />
                  <strong style={{ color: '#3B2F2B' }}>{otpEmail}</strong>
                </p>

                {error && <div style={{ color: '#D32F2F', fontSize: '0.9rem', textAlign: 'center', marginBottom: '15px', padding: '12px', background: 'rgba(211,47,47,0.1)', borderRadius: '8px', border: '1px solid rgba(211,47,47,0.2)' }}>{error}</div>}
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
                        width: '48px', height: '56px', textAlign: 'center',
                        fontSize: '1.5rem', fontWeight: 700, color: '#3B2F2B',
                        borderWidth: '2px',
                        borderStyle: 'solid',
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
                  className="login-btn"
                  onClick={handleVerifyOtp}
                  disabled={loading || otp.join("").length !== 6}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  {loading ? "Verifying..." : "Verify Email"}
                  <FaShieldAlt />
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
                  <span onClick={() => { setShowOtp(false); setError(""); setSuccess(""); }}>
                    ← Back to Login
                  </span>
                </p>
              </>
            ) : (
              /* ============ LOGIN FORM ============ */
              <>
                <h2>Welcome Back!</h2>
                {error && <div style={{ color: "red", marginBottom: "10px", textAlign: "center" }}>{error}</div>}
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
                  <button type="submit" className="login-btn" disabled={loading}>
                    {loading ? "Processing..." : "Login"}
                    <FaArrowRight className="btn-icon" />
                  </button>
                </form>
                <p className="switch-mode">
                  Don't have an account? <span onClick={openSignUp}>Register</span>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignInModal;
