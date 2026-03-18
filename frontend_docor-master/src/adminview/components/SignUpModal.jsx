import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./SignUpModal.css";
import logo from "../../assets/logo.jpg";
import { FaTimes, FaUser, FaEnvelope, FaPhone, FaLock, FaArrowRight } from 'react-icons/fa';
import { useAuth } from "../../context/AuthContext";
import { useModal } from "../../context/ModalContext";

const SignUpModal = ({ isOpen, onClose }) => {
    const navigate = useNavigate();
    const { signup } = useAuth();
    const { openSignIn } = useModal();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setName("");
            setEmail("");
            setPhone("");
            setPassword("");
            setConfirmPassword("");
            setError("");
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (password !== confirmPassword) {
            setError("Passwords do not match!");
            return;
        }

        setLoading(true);
        try {
            const result = await signup({ name, email, phone, password, confirmPassword });
            if (result.success) {
                onClose();
                navigate("/"); // Redirect to home after successful registration
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
                    </div>

                    {/* RIGHT SIDE */}
                    <div className="auth-right">
                        <h2>Create an Account</h2>
                        {error && <div style={{ color: "red", marginBottom: "10px", textAlign: "center" }}>{error}</div>}
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
                                        type="tel"
                                        placeholder="Phone Number (Optional)"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className="auth-input"
                                    />
                                    <FaPhone className="input-icon" />
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

                            <button type="submit" className="login-btn" disabled={loading}>
                                {loading ? "Processing..." : "Register"}
                                <FaArrowRight className="btn-icon" />
                            </button>
                        </form>

                        <p className="switch-mode">
                            Already have an account?{" "}
                            <span onClick={openSignIn}>Login</span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SignUpModal;
