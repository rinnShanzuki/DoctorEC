import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSiteSettings } from '../context/SiteSettingsContext';

const DEFAULT_CTA = {
    enabled: true,
    text: 'Book your eye care appointment today — Expert optical care awaits!',
    button_label: 'Book Now',
    button_link: '/appointments',
};

const CTAStrip = () => {
    const navigate = useNavigate();
    const { getSetting } = useSiteSettings();

    const raw = getSetting('cta_settings', DEFAULT_CTA);
    const config = { ...DEFAULT_CTA, ...(typeof raw === 'string' ? JSON.parse(raw) : raw) };

    if (!config.enabled) return null;

    return (
        <section className="cta-section" style={styles.section}>
            <div className="container cta-container" style={styles.container}>
                <h2 style={styles.text}>{config.text}</h2>
                <button style={styles.button} onClick={() => navigate(config.button_link || '/appointments')}>
                    {config.button_label || 'Start Test'}
                </button>
            </div>
        </section>
    );
};

const styles = {
    section: {
        backgroundColor: 'var(--color-dark-brown)',
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
