import React from 'react';
import { FaBrain, FaGlasses, FaBoxes, FaEye, FaHeart, FaStar, FaClock, FaShieldAlt, FaUserMd, FaStethoscope, FaHandHoldingMedical, FaCog } from 'react-icons/fa';
import { useSiteSettings } from '../context/SiteSettingsContext';

// Icon map to resolve icon names from settings
const ICON_MAP = {
    'brain': <FaBrain />,
    'glasses': <FaGlasses />,
    'boxes': <FaBoxes />,
    'eye': <FaEye />,
    'heart': <FaHeart />,
    'star': <FaStar />,
    'clock': <FaClock />,
    'shield': <FaShieldAlt />,
    'user-md': <FaUserMd />,
    'stethoscope': <FaStethoscope />,
    'medical': <FaHandHoldingMedical />,
    'cog': <FaCog />,
};

const DEFAULT_FEATURES = {
    enabled: true,
    title: 'Why Choose Us?',
    items: [
        { title: 'AI-Powered Management', description: 'Smart scheduling and patient management powered by advanced algorithms.', icon: 'brain' },
        { title: 'Smart Recommendations', description: 'Get personalized eyewear suggestions based on your facial features and style.', icon: 'glasses' },
        { title: 'Real-Time Inventory', description: 'Check availability of frames and lenses instantly with our live system.', icon: 'boxes' },
        { title: 'Online Vision Test', description: 'Perform a preliminary vision check from home with our calibrated tool.', icon: 'eye' },
    ],
};

const Features = () => {
    const { getSetting } = useSiteSettings();
    const raw = getSetting('features_settings', DEFAULT_FEATURES);
    const config = { ...DEFAULT_FEATURES, ...(typeof raw === 'string' ? JSON.parse(raw) : raw) };

    if (!config.enabled) return null;
    if (!config.items || config.items.length === 0) return null;

    return (
        <section className="features-section" style={styles.section}>
            <div className="container" style={styles.container}>
                <h2 style={styles.title}>{config.title}</h2>
                <div className="features-grid" style={styles.grid}>
                    {config.items.map((feature, idx) => (
                        <div key={idx} style={styles.column}>
                            <div style={styles.iconWrapper}>
                                {ICON_MAP[feature.icon] || <FaStar />}
                            </div>
                            <h3 style={styles.featureTitle}>{feature.title}</h3>
                            <p style={styles.featureDesc}>{feature.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

const styles = {
    section: {
        backgroundColor: 'var(--color-white)',
        padding: '80px 0',
    },
    container: {
        maxWidth: 'var(--max-width)',
        margin: '0 auto',
        padding: '0 20px',
        textAlign: 'center',
    },
    title: {
        fontFamily: 'var(--font-heading-poppins)',
        fontSize: '2.5rem',
        color: 'var(--color-dark-brown)',
        marginBottom: '60px',
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '40px',
    },
    column: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
    },
    iconWrapper: {
        fontSize: '3rem',
        color: 'var(--color-dark-brown)',
        marginBottom: '20px',
        padding: '20px',
        border: '1px solid var(--color-light-brown)',
        borderRadius: '2px',
    },
    featureTitle: {
        fontFamily: 'var(--font-heading-montserrat)',
        fontSize: '1.25rem',
        color: 'var(--color-dark-brown)',
        marginBottom: '10px',
        fontWeight: '600',
    },
    featureDesc: {
        fontFamily: 'var(--font-body-inter)',
        color: 'var(--color-text-secondary)',
        fontSize: '0.95rem',
        lineHeight: '1.5',
    },
};

export default Features;
