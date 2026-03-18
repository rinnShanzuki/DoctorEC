import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./AuthModal.css";
import logo from "../../assets/logo.jpg";
import { FaTimes, FaUser, FaEnvelope, FaLock, FaArrowRight } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import { useModal } from "../../context/ModalContext";

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
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsRegister(initialMode === "register");
            setName("");
            setEmail("");
            setPassword("");
            setConfirmPassword("");
            setError("");
        }
    }, [isOpen, initialMode]);

    const toggleMode = () => {
        setIsRegister(!isRegister);
        setError("");
        // Update context if needed, but local state toggle is smoother for UX
        // If we want URL to change, we might need to handle that, but for now local toggle is fine.
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

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

            if (result.success) {
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
                <div className="auth-content">
                    {/* LEFT SIDE */}
                    <div className="auth-left">
                        <img src={logo} alt="Clinic Logo" className="auth-logo" />
                        <h1>Doctor EC Optical Clinic</h1>
                        <p>Your Vision, Our Focus.</p>
                        {isRegister && (
                            null
                        )}
                    </div>

                    {/* RIGHT SIDE */}
                    <div className="auth-right">
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
                    </div>
                </div>
                <button className="close-btn" onClick={onClose}>
                    <FaTimes />
                </button>
            </div>
        </div>
    );
};

export default AuthModal;
