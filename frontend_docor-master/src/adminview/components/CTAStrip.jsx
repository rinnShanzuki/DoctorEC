import React from 'react';
import { useNavigate } from 'react-router-dom';

const CTAStrip = ({ text, buttonText }) => {
    const navigate = useNavigate();
    const displayText = text || "Book your eye care appointment today — Expert optical care awaits!";
    const displayButtonText = buttonText || "Book Now";

    return (
        <section style={styles.section}>
            <div className="container" style={styles.container}>
                <h2 style={styles.text}>{displayText}</h2>
                <button style={styles.button} onClick={() => navigate('/appointments')}>{displayButtonText}</button>
            </div>
        </section>
    );
};

const styles = {
    section: {
        backgroundColor: 'var(--color-dark-brown)', // Changed to match Navbar
        padding: '60px 0',
        color: 'var(--color-white)',
    },
    container: {
        maxWidth: 'var(--max-width)',
        margin: '0 auto',
        padding: '0 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '20px',
    },
    text: {
        fontFamily: 'var(--font-heading-poppins)',
        fontSize: '1.8rem',
        fontWeight: '600',
        color: 'var(--color-white)',
        margin: 0,
    },
    button: {
        backgroundColor: 'var(--color-white)',
        color: 'var(--color-dark-brown)',
        padding: '14px 32px',
        fontSize: '1rem',
        fontWeight: '600',
        border: 'none',
        borderRadius: 'var(--border-radius)',
        cursor: 'pointer',
        transition: 'background-color 0.2s ease',
    },
};

export default CTAStrip;
