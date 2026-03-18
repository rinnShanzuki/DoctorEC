

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./SignInModal.css";
import logo from "../../assets/logo.jpg";
import { FaTimes, FaEnvelope, FaLock, FaArrowRight } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import { useModal } from "../../context/ModalContext";

function SignInModal({ isOpen, onClose, onSignInSuccess }) {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { openSignUp } = useModal();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setEmail("");
      setPassword("");
      setError("");
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await login(email, password);
      if (result.success) {
        if (onSignInSuccess) onSignInSuccess(result.user);
        onClose();
        if (result.user.role === "admin") {
          navigate("/admin");
        } else {
          navigate("/");
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
          </div>
          <div className="auth-right">
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
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignInModal;

