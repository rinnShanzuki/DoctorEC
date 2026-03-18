import React, { useState } from 'react';
import { FaUserMd, FaPhoneAlt, FaVideo, FaCalendar, FaHeart, FaStar, FaClock, FaShieldAlt, FaGlasses, FaEye, FaBrain, FaBoxes, FaStethoscope, FaHandHoldingMedical, FaCog, FaInfoCircle } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSiteSettings } from '../context/SiteSettingsContext';
import ConfirmationModal from './ConfirmationModal';

const ICON_MAP = {
    'user-md': <FaUserMd />, 'phone': <FaPhoneAlt />, 'video': <FaVideo />,
    'calendar': <FaCalendar />, 'heart': <FaHeart />, 'star': <FaStar />,
    'clock': <FaClock />, 'shield': <FaShieldAlt />, 'glasses': <FaGlasses />,
    'eye': <FaEye />, 'brain': <FaBrain />, 'boxes': <FaBoxes />,
    'stethoscope': <FaStethoscope />, 'medical': <FaHandHoldingMedical />,
    'cog': <FaCog />, 'info': <FaInfoCircle />,
};

const DEFAULT_INFO = {
    enabled: true,
    title: 'Book Your Preferred Check-Up',
    cards: [
        { title: 'In-Person Visit', description: 'Schedule a comprehensive eye exam at our clinic with our specialists.', icon: 'user-md' },
        { title: 'Phone Consultation', description: 'Speak directly with an optometrist for quick advice and follow-ups.', icon: 'phone' },
        { title: 'Video Conference', description: 'Get a remote consultation from the comfort of your home via video call.', icon: 'video' },
    ],
};

const AppointmentTypes = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [showModal, setShowModal] = useState(false);
    const { getSetting } = useSiteSettings();

    const raw = getSetting('info_cards', DEFAULT_INFO);
    const config = { ...DEFAULT_INFO, ...(typeof raw === 'string' ? JSON.parse(raw) : raw) };

    if (!config.enabled) return null;
    if (!config.cards || config.cards.length === 0) return null;

    const handleBookClick = () => {
        if (!user) {
            setShowModal(true);
            return;
        }
        navigate('/appointments');
    };

    const handleConfirm = () => {
        setShowModal(false);
        navigate('/login');
    };

    return (
        <section className="appointment-types-section" style={styles.section}>
            <div className="container" style={styles.container}>
                <h2 style={styles.title}>{config.title}</h2>
                <div style={styles.grid}>
                    {config.cards.map((card, idx) => (
                        <div key={idx} style={styles.card}>
                            <div style={styles.iconWrapper}>
                                {ICON_MAP[card.icon] || <FaInfoCircle />}
                            </div>
                            <h3 style={styles.cardTitle}>{card.title}</h3>
                            <p style={styles.cardDesc}>{card.description}</p>
                            <button style={styles.bookBtn} onClick={handleBookClick}>Book Now</button>
                        </div>
                    ))}
                </div>
            </div>
            <ConfirmationModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onConfirm={handleConfirm}
                title="Login Required"
                message="You must be logged in to book an appointment. Would you like to go to the login page?"
            />
        </section>
    );
};

const styles = {
    section: { backgroundColor: 'var(--color-light-brown)', padding: '80px 0' },
    container: { maxWidth: 'var(--max-width)', margin: '0 auto', padding: '0 20px', textAlign: 'center' },
    title: { fontFamily: 'var(--font-heading-poppins)', fontSize: '2.5rem', color: '#FAF0CA', marginBottom: '50px' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' },
    card: {
        backgroundColor: 'var(--color-cream-white)', padding: '40px 30px', textAlign: 'center',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        border: '1px solid #E0E0E0', borderRadius: 'var(--border-radius)', transition: 'transform 0.2s ease',
    },
    iconWrapper: { fontSize: '2.5rem', color: 'var(--color-dark-brown)', marginBottom: '20px' },
    cardTitle: { fontFamily: 'var(--font-heading-montserrat)', fontSize: '1.5rem', color: 'var(--color-dark-brown)', marginBottom: '15px' },
    cardDesc: { fontFamily: 'var(--font-body-inter)', color: 'var(--color-text-secondary)', marginBottom: '25px', fontSize: '0.95rem' },
    bookBtn: {
        marginTop: 'auto', backgroundColor: 'var(--color-dark-brown)', color: 'var(--color-white)',
        padding: '10px 24px', fontSize: '0.9rem', fontWeight: '500', border: 'none',
        borderRadius: 'var(--border-radius)', transition: 'background-color 0.2s ease',
    },
};

export default AppointmentTypes;
