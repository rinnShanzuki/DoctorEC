import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { FaUser, FaEnvelope, FaLock, FaArrowRight } from "react-icons/fa";
import logo from "../../assets/logo.jpg";
import "../components/SignInModal.css";

const Login = () => {
    const location = useLocation();
    const [isRegister, setIsRegister] = useState(location.state?.isRegister || false);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login, register } = useAuth(); // Assuming register exists or we'll add it
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (isRegister && password !== confirmPassword) {
            setError("Passwords do not match!");
            return;
        }

        setLoading(true);

        try {
            let result;
            if (isRegister) {
                // If register function exists in context, use it. Otherwise, this might fail if not implemented.
                // For now, we'll assume login works for both or we'll try to implement register call if context supports it.
                // If context doesn't have register, we'll fall back to a simulated register or error.
                if (register) {
                    result = await register(name, email, password);
                } else {
                    // Fallback if register is not in context yet (based on previous files, it might not be)
                    // We will try to use the API directly or just show error
                    setError("Registration not fully implemented in AuthContext yet.");
                    setLoading(false);
                    return;
                }
            } else {
                result = await login(email, password);
            }

            if (result.success) {
                if (result.user.role === 'admin') {
                    navigate('/admin');
                } else {
                    navigate('/');
                }
            } else {
                setError(result.message || "Authentication failed");
            }
        } catch (err) {
            setError("An unexpected error occurred.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <Navbar />
            <div style={styles.pageContainer}>
                <div className="auth-box" style={styles.authBoxOverride}>
                    <div className="auth-content">
                        {/* LEFT SIDE */}
                        <div className="auth-left">
                            <img src={logo} alt="Clinic Logo" className="auth-logo" />
                            <h1>Doctor EC Optical Clinic</h1>
                            <p>Your Vision, Our Focus.</p>
                        </div>

                        {/* RIGHT SIDE */}
                        <div className="auth-right">
                            <h2>{isRegister ? "Create an Account" : "Welcome Back!"}</h2>

                            {error && <div style={styles.error}>{error}</div>}

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
                                    {loading ? 'Processing...' : (isRegister ? "Register" : "Login")}
                                    <FaArrowRight className="btn-icon" />
                                </button>
                            </form>

                            <p className="switch-mode">
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
            <Footer />
        </div>
    );
};

const styles = {
    pageContainer: {
        minHeight: 'calc(100vh - 80px)', // Adjust for navbar height
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
        backgroundColor: '#f5f5f5', // Light gray background
    },
    authBoxOverride: {
        boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
        margin: '0 auto',
    },
    error: {
        color: '#d32f2f',
        backgroundColor: '#ffebee',
        padding: '10px',
        borderRadius: '4px',
        marginBottom: '15px',
        fontSize: '0.9rem',
        textAlign: 'center'
    }
};

export default Login;
