import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const SignInModal = ({ onClose, onSignInSuccess }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        fullName: '',
        phone: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const { login, signup } = useAuth();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');

        if (isLogin) {
            if (login(formData.email, formData.password)) {
                onSignInSuccess({ email: formData.email });
            } else {
                setError('Invalid email or password');
            }
        } else {
            if (formData.password !== formData.confirmPassword) {
                setError('Passwords do not match');
                return;
            }
            if (signup(formData)) {
                onSignInSuccess({ email: formData.email, fullName: formData.fullName });
            } else {
                setError('Email already exists');
            }
        }
    };

    return (
        <div className="modal-overlay" style={styles.overlay}>
            <div className="modal-content" style={styles.modal}>
                <button onClick={onClose} style={styles.closeBtn}>&times;</button>
                <h2 style={styles.title}>{isLogin ? 'Sign In' : 'Create Account'}</h2>

                {error && <div style={styles.error}>{error}</div>}

                <form onSubmit={handleSubmit} style={styles.form}>
                    {!isLogin && (
                        <>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Full Name</label>
                                <input
                                    type="text"
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    style={styles.input}
                                    required
                                />
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Phone</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    style={styles.input}
                                    required
                                />
                            </div>
                        </>
                    )}

                    <div style={styles.formGroup}>
                        <label style={styles.label}>Email</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            style={styles.input}
                            required
                        />
                    </div>

                    <div style={styles.formGroup}>
                        <label style={styles.label}>Password</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            style={styles.input}
                            required
                        />
                    </div>

                    {!isLogin && (
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Confirm Password</label>
                            <input
                                type="password"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                style={styles.input}
                                required
                            />
                        </div>
                    )}

                    <button type="submit" style={styles.submitBtn}>
                        {isLogin ? 'Sign In' : 'Sign Up'}
                    </button>
                </form>

                <p style={styles.toggleText}>
                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                    <button
                        onClick={() => setIsLogin(!isLogin)}
                        style={styles.toggleBtn}
                    >
                        {isLogin ? 'Sign Up' : 'Sign In'}
                    </button>
                </p>
            </div>
        </div>
    );
};

const styles = {
    overlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    modal: {
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '8px',
        width: '100%',
        maxWidth: '400px',
        position: 'relative',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    },
    closeBtn: {
        position: 'absolute',
        top: '10px',
        right: '10px',
        background: 'none',
        border: 'none',
        fontSize: '24px',
        cursor: 'pointer',
        color: '#666',
    },
    title: {
        textAlign: 'center',
        marginBottom: '20px',
        color: '#333',
        fontFamily: 'var(--font-heading-montserrat)',
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '15px',
    },
    formGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '5px',
    },
    label: {
        fontSize: '14px',
        color: '#666',
        fontFamily: 'var(--font-body-inter)',
    },
    input: {
        padding: '10px',
        borderRadius: '4px',
        border: '1px solid #ddd',
        fontSize: '16px',
    },
    submitBtn: {
        backgroundColor: 'var(--color-dark-brown)',
        color: 'white',
        padding: '12px',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '16px',
        fontWeight: '600',
        marginTop: '10px',
    },
    toggleText: {
        textAlign: 'center',
        marginTop: '20px',
        fontSize: '14px',
        color: '#666',
    },
    toggleBtn: {
        background: 'none',
        border: 'none',
        color: 'var(--color-dark-brown)',
        fontWeight: '600',
        cursor: 'pointer',
        textDecoration: 'underline',
    },
    error: {
        backgroundColor: '#fee2e2',
        color: '#dc2626',
        padding: '10px',
        borderRadius: '4px',
        marginBottom: '15px',
        fontSize: '14px',
        textAlign: 'center',
    }
};

export default SignInModal;
