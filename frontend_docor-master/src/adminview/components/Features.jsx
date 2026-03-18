import React from 'react';
import { FaBrain, FaGlasses, FaBoxes, FaEye } from 'react-icons/fa';

const Features = ({ features: propFeatures }) => {
    const defaultFeatures = [
        {
            id: 1,
            title: 'AI-Powered Management',
            description: 'Smart scheduling and patient management powered by advanced algorithms.',
            icon: <FaBrain />,
        },
        {
            id: 2,
            title: 'Smart Recommendations',
            description: 'Get personalized eyewear suggestions based on your facial features and style.',
            icon: <FaGlasses />,
        },
        {
            id: 3,
            title: 'Real-Time Inventory',
            description: 'Check availability of frames and lenses instantly with our live system.',
            icon: <FaBoxes />,
        },
        {
            id: 4,
            title: 'Online Vision Test',
            description: 'Perform a preliminary vision check from home with our calibrated tool.',
            icon: <FaEye />,
        },
    ];

    const displayFeatures = propFeatures || defaultFeatures;

    return (
        <section style={styles.section}>
            <div className="container" style={styles.container}>
                <h2 style={styles.title}>Why Choose Doctor EC Optical Clinic?</h2>
                <div style={styles.grid}>
                    {displayFeatures.map((feature) => (
                        <div key={feature.id} style={styles.column}>
                            <div style={styles.iconWrapper}>{feature.icon}</div>
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
        border: '2px solid var(--color-dark-brown)',
        borderRadius: '50%', // Keep icons circular or square? User said "monochrome brown stroke style". Let's keep it simple, maybe just the icon.
        // User said "simple line icon". React icons are filled usually. I'll stick to the icon itself.
        // Let's remove border radius if we want sharp, but icons are usually organic.
        // Let's just have the icon.
        padding: '20px',
        border: '1px solid var(--color-light-brown)', // Light border container
        borderRadius: '2px', // Sharp corners for the container
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
