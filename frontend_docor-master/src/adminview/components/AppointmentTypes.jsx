import React from 'react';
import { FaUserMd, FaPhoneAlt, FaVideo } from 'react-icons/fa';

const AppointmentTypes = ({ onBookClick }) => {
    const appointments = [
        {
            id: 1,
            title: 'In-Person Visit',
            description: 'Schedule a comprehensive eye exam at our clinic with our specialists.',
            icon: <FaUserMd />,
        },
        {
            id: 2,
            title: 'Phone Consultation',
            description: 'Speak directly with an optometrist for quick advice and follow-ups.',
            icon: <FaPhoneAlt />,
        },
        {
            id: 3,
            title: 'Video Conference',
            description: 'Get a remote consultation from the comfort of your home via video call.',
            icon: <FaVideo />,
        },
    ];

    return (
        <section style={styles.section}>
            <div className="container" style={styles.container}>
                <h2 style={styles.title}>Book Your Preferred Check-Up</h2>
                <div style={styles.grid}>
                    {appointments.map((app) => (
                        <div key={app.id} style={styles.card}>
                            <div style={styles.iconWrapper}>{app.icon}</div>
                            <h3 style={styles.cardTitle}>{app.title}</h3>
                            <p style={styles.cardDesc}>{app.description}</p>
                            <button style={styles.bookBtn} onClick={onBookClick}>Book Now</button>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

const styles = {
    section: {
        backgroundColor: 'var(--color-light-brown)',
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
        color: '#FAF0CA',
        marginBottom: '50px',
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '30px',
    },
    card: {
        backgroundColor: 'var(--color-cream-white)', // Slightly lighter for contrast or keep transparent? Request said "on a light beige background". Let's make cards white or transparent? "Each card includes...". Usually cards have background. Let's use white for cards to pop against light beige.
        padding: '40px 30px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        border: '1px solid #E0E0E0', // Subtle border
        borderRadius: 'var(--border-radius)',
        transition: 'transform 0.2s ease',
    },
    iconWrapper: {
        fontSize: '2.5rem',
        color: 'var(--color-dark-brown)',
        marginBottom: '20px',
    },
    cardTitle: {
        fontFamily: 'var(--font-heading-montserrat)',
        fontSize: '1.5rem',
        color: 'var(--color-dark-brown)',
        marginBottom: '15px',
    },
    cardDesc: {
        fontFamily: 'var(--font-body-inter)',
        color: 'var(--color-text-secondary)',
        marginBottom: '25px',
        fontSize: '0.95rem',
    },
    bookBtn: {
        marginTop: 'auto',
        backgroundColor: 'var(--color-dark-brown)',
        color: 'var(--color-white)',
        padding: '10px 24px',
        fontSize: '0.9rem',
        fontWeight: '500',
        border: 'none',
        borderRadius: 'var(--border-radius)',
        transition: 'background-color 0.2s ease',
    },
};

export default AppointmentTypes;
