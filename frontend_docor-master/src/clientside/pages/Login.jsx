import React, { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import "./Login.css";
import logo from "../../assets/logo.jpg";
import coverImage from "../../assets/cover-nobg.png";
import { FaEnvelope, FaLock, FaArrowRight, FaArrowLeft } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";

function Login() {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState(location.state?.message || "");
    const [loading, setLoading] = useState(false);

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccessMessage("");
        setLoading(true);
        try {
            const result = await login(email, password);
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
                    <p className="switch-mode">
                        Don't have an account? <Link to="/signup">Register</Link>
                    </p>
                </div>
            </div>

            <footer className="auth-footer">
                © 2025 Doctor EC Optical Clinic. All rights reserved.
            </footer>
        </div>
    );
}

export default Login;
