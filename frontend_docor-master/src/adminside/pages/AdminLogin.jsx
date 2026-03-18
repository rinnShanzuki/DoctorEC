import React, { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import "./AdminAuth.css";
import logo from "../../assets/logo.jpg";
import { FaEnvelope, FaLock, FaArrowRight, FaArrowLeft, FaShieldAlt } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";

function AdminLogin() {
    const navigate = useNavigate();
    const location = useLocation();
    const { adminLogin, logout } = useAuth();
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

    // Hide chatbot for admin auth
    useEffect(() => {
        const chatbot = document.querySelector('.chatbot-container');
        if (chatbot) chatbot.style.display = 'none';
        return () => {
            const chatbot = document.querySelector('.chatbot-container');
            if (chatbot) chatbot.style.display = 'block';
        };
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccessMessage("");
        setLoading(true);

        try {
            const result = await adminLogin(email, password);
            if (result.success) {
                // Redirect based on role
                switch (result.user.role_id) {
                    case 1: // Admin - Full access
                        navigate("/admin/dashboard");
                        break;
                    case 2: // Cashier - CashierPOS only
                        navigate("/cashier");
                        break;
                    case 3: // Staff - Appointments, Reservations, Products
                        navigate("/admin/dashboard/appointments");
                        break;
                    default:
                        await logout();
                        setError("Access Denied: Unknown role.");
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
        <div className="admin-auth-page">
            <Link to="/" className="back-to-home">
                <FaArrowLeft /> Return to Site
            </Link>

            <div className="auth-container">
                {/* LEFT SIDE: BRANDING */}
                <div className="auth-left">
                    <img src={logo} alt="Clinic Logo" className="auth-logo" />
                    <h1>Administrator Access</h1>
                    <p>Management Portal</p>
                </div>

                {/* RIGHT SIDE: FORM */}
                <div className="auth-right">
                    <h2>Admin Login</h2>
                    {successMessage && <div className="success-message">{successMessage}</div>}
                    {error && <div className="error-message">{error}</div>}

                    <form onSubmit={handleSubmit}>
                        <div className="input-group">
                            <div className="input-wrapper">
                                <input
                                    type="email"
                                    placeholder="Admin Email"
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
                            {loading ? "Verifying..." : "Access Dashboard"}
                            <FaArrowRight className="btn-icon" />
                        </button>
                    </form>

                    <p className="switch-mode">
                        Need admin access? <Link to="/admin/signup">Request Access</Link>
                    </p>
                </div>
            </div>

            <footer className="auth-footer">
                © 2025 Doctor EC Optical Clinic. Authorized Personnel Only.
            </footer>
        </div>
    );
}

export default AdminLogin;
