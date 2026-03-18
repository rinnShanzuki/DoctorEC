import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./AdminAuth.css";
import logo from "../../assets/logo.jpg";
import { FaUser, FaEnvelope, FaLock, FaArrowRight, FaArrowLeft, FaShieldAlt } from 'react-icons/fa';
import { useAuth } from "../../context/AuthContext";

const AdminSignup = () => {
    const navigate = useNavigate();
    const { adminSignup } = useAuth();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

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

        if (password !== confirmPassword) {
            setError("Passwords do not match!");
            return;
        }

        setLoading(true);
        try {
            // Include role: 'admin' in the registration data
            const result = await adminSignup({
                name,
                email,
                password,
                confirmPassword,
                role: 'admin'
            });

            if (result.success) {
                navigate("/admin/login", { state: { message: "Admin account request sent/created. Please log in." } });
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

    return (
        <div className="admin-auth-page">
            <Link to="/" className="back-to-home">
                <FaArrowLeft /> Return to Site
            </Link>

            <div className="auth-container">
                {/* LEFT SIDE: BRANDING */}
                <div className="auth-left">
                    <img src={logo} alt="Clinic Logo" className="auth-logo" />
                    <h1>Admin Registration</h1>
                    <p>Create Management Account</p>
                </div>

                {/* RIGHT SIDE: FORM */}
                <div className="auth-right">
                    <h2>Sign Up</h2>
                    {error && <div className="error-message">{error}</div>}

                    <form onSubmit={handleSubmit}>
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

                        <button type="submit" className="auth-btn" disabled={loading}>
                            {loading ? "Processing..." : "Create Admin Account"}
                            <FaArrowRight className="btn-icon" />
                        </button>
                    </form>

                    <p className="switch-mode">
                        Already have an admin account?{" "}
                        <Link to="/admin/login">Login Here</Link>
                    </p>
                </div>
            </div>

            <footer className="auth-footer">
                © 2025 Doctor EC Optical Clinic. Authorized Personnel Only.
            </footer>
        </div>
    );
};

export default AdminSignup;
