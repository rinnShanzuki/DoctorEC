import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const SignUp = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { signup } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match!');
            return;
        }

        if (formData.password.length < 8) {
            setError('Password must be at least 8 characters long.');
            return;
        }

        setLoading(true);

        const result = await signup(formData);

        setLoading(false);

        if (result.success) {
            // Registration successful, redirect to login
            navigate('/login');
        } else {
            setError(result.message);
        }
    };

    return (
        <div>
            <Navbar />
            <div style={styles.container}>
                <div style={styles.splitLayout}>
                    <div style={styles.imageSide}>
                        <div style={styles.overlay}>
                            <h2 style={styles.overlayTitle}>Join Doctor EC Optical Clinic</h2>
                            <p style={styles.overlayText}>Create an account to manage your vision care.</p>
                        </div>
                    </div>
                    <div style={styles.formSide}>
                        <form onSubmit={handleSubmit} style={styles.form}>
                            <h2 style={styles.title}>Sign Up</h2>

                            {error && (
                                <div style={styles.errorBox}>
                                    {error}
                                </div>
                            )}

                            <div style={styles.formGroup}>
                                <label style={styles.label}>Full Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    style={styles.input}
                                    required
                                    disabled={loading}
                                />
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    style={styles.input}
                                    required
                                    disabled={loading}
                                />
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Phone Number</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    style={styles.input}
                                    required
                                    disabled={loading}
                                />
                            </div>
                            <div style={styles.row}>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Password</label>
                                    <input
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        style={styles.input}
                                        required
                                        disabled={loading}
                                    />
                                </div>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Confirm Password</label>
                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        style={styles.input}
                                        required
                                        disabled={loading}
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                style={loading ? { ...styles.submitBtn, opacity: 0.6 } : styles.submitBtn}
                                disabled={loading}
                            >
                                {loading ? 'Creating Account...' : 'Create Account'}
                            </button>
                            <p style={styles.footerText}>
                                Already have an account? <Link to="/login" style={styles.link}>Login</Link>
                            </p>
                        </form>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

const styles = {
    container: {
        minHeight: '90vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
        backgroundColor: 'var(--color-cream-white)',
    },
    splitLayout: {
        display: 'flex',
        width: '100%',
        maxWidth: '900px',
        backgroundColor: 'var(--color-white)',
        borderRadius: 'var(--border-radius)',
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
        minHeight: '600px',
    },
    imageSide: {
        flex: 1,
        backgroundColor: 'var(--color-dark-brown)',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    overlay: {
        textAlign: 'center',
        color: 'var(--color-white)',
        padding: '20px',
    },
    overlayTitle: {
        fontFamily: 'var(--font-heading-poppins)',
        fontSize: '2rem',
        marginBottom: '10px',
    },
    overlayText: {
        fontFamily: 'var(--font-body-inter)',
        fontSize: '1rem',
    },
    formSide: {
        flex: 1.5,
        padding: '50px',
        display: 'flex',
        alignItems: 'center',
    },
    form: {
        width: '100%',
    },
    title: {
        fontFamily: 'var(--font-heading-montserrat)',
        fontSize: '2rem',
        color: 'var(--color-dark-brown)',
        marginBottom: '30px',
    },
    formGroup: {
        marginBottom: '20px',
        width: '100%',
    },
    row: {
        display: 'flex',
        gap: '20px',
    },
    label: {
        display: 'block',
        fontFamily: 'var(--font-body-inter)',
        fontWeight: '500',
        marginBottom: '8px',
        color: 'var(--color-text-secondary)',
    },
    input: {
        width: '100%',
        padding: '12px',
        border: '1px solid #D7CCC8',
        borderRadius: 'var(--border-radius)',
        fontFamily: 'var(--font-body-inter)',
        fontSize: '1rem',
    },
    submitBtn: {
        backgroundColor: 'var(--color-dark-brown)',
        color: 'var(--color-white)',
        padding: '14px',
        fontSize: '1rem',
        fontWeight: '600',
        width: '100%',
        marginTop: '10px',
        marginBottom: '20px',
    },
    footerText: {
        textAlign: 'center',
        fontFamily: 'var(--font-body-inter)',
        color: 'var(--color-text-secondary)',
    },
    link: {
        color: 'var(--color-dark-brown)',
        fontWeight: '600',
        textDecoration: 'none',
    },
    errorBox: {
        backgroundColor: '#ffebee',
        color: '#c62828',
        padding: '12px',
        borderRadius: 'var(--border-radius)',
        marginBottom: '20px',
        fontFamily: 'var(--font-body-inter)',
        fontSize: '0.9rem',
        border: '1px solid #ef5350'
    }
};

export default SignUp;
