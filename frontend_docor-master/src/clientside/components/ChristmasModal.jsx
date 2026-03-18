import React, { useState } from "react";
import "./ChristmasModal.css";
import logo from "../../assets/logo.jpg";
import { FaTimes, FaUser, FaEnvelope, FaLock, FaArrowRight } from "react-icons/fa";

function ChristmasModal({ isOpen, onClose, onSignInSuccess }) {
    if (!isOpen) return null;

    const [isRegister, setIsRegister] = useState(true);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();

        if (isRegister && password !== confirmPassword) {
            alert("Passwords do not match!");
            return;
        }

        const userData = {
            name: isRegister ? name : "User",
            email: email,
            age: 25,
            gender: "Not specified",
            phone: "N/A",
        };

        if (onSignInSuccess) {
            onSignInSuccess(userData);
        }
        onClose();
    };

    return (
        <div className="christmas-modal-overlay" onClick={onClose}>
            <div className="christmas-auth-box" onClick={(e) => e.stopPropagation()}>
                <button className="christmas-close-btn" onClick={onClose}>
                    <FaTimes />
                </button>

                <div className="christmas-auth-content">
                    {/* LEFT SIDE */}
                    <div className="christmas-auth-left">
                        <img src={logo} alt="Clinic Logo" className="christmas-auth-logo" />
                        <h1>Doctor EC Optical Clinic</h1>
                        <p>Your Vision, Our Focus.</p>
                    </div>

                    {/* RIGHT SIDE */}
                    <div className="christmas-auth-right">
                        <h2>{isRegister ? "Create an Account" : "Welcome Back!"}</h2>
                        <form onSubmit={handleSubmit}>
                            {isRegister && (
                                <div className="christmas-input-group">
                                    <div className="christmas-input-wrapper">
                                        <input
                                            type="text"
                                            placeholder="Full Name"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            required
                                            className="christmas-auth-input"
                                        />
                                        <FaUser className="christmas-input-icon" />
                                    </div>
                                </div>
                            )}

                            <div className="christmas-input-group">
                                <div className="christmas-input-wrapper">
                                    <input
                                        type="email"
                                        placeholder="Email Address"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="christmas-auth-input"
                                    />
                                    <FaEnvelope className="christmas-input-icon" />
                                </div>
                            </div>

                            <div className="christmas-input-group">
                                <div className="christmas-input-wrapper">
                                    <input
                                        type="password"
                                        placeholder="Password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="christmas-auth-input"
                                    />
                                    <FaLock className="christmas-input-icon" />
                                </div>
                            </div>

                            {isRegister && (
                                <div className="christmas-input-group">
                                    <div className="christmas-input-wrapper">
                                        <input
                                            type="password"
                                            placeholder="Confirm Password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required
                                            className="christmas-auth-input"
                                        />
                                        <FaLock className="christmas-input-icon" />
                                    </div>
                                </div>
                            )}

                            <button type="submit" className="christmas-login-btn">
                                {isRegister ? "Register" : "Login"}
                                <FaArrowRight className="btn-icon" />
                            </button>
                        </form>

                        <p className="christmas-switch-mode">
                            {isRegister ? (
                                <>
                                    Already have an account?{" "}
                                    <span onClick={() => setIsRegister(false)}>Login</span>
                                </>
                            ) : (
                                <>
                                    Don't have an account?{" "}
                                    <span onClick={() => setIsRegister(true)}>Register</span>
                                </>
                            )}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ChristmasModal;
