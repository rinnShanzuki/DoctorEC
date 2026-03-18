import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSiteSettings } from '../context/SiteSettingsContext';

const DEFAULT_PROMO = {
    enabled: false,
    title: '',
    subtitle: '',
    description: '',
    date_range: '',
    offers: [],
    cta_text: 'Book Now',
    cta_link: '/appointments',
    bg_color: '#5D4037',
    accent_color: '#FFD700',
};

const PromoSection = ({ onBookNow }) => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { getSetting } = useSiteSettings();

    const raw = getSetting('promo_settings', DEFAULT_PROMO);
    const promo = { ...DEFAULT_PROMO, ...(typeof raw === 'string' ? JSON.parse(raw) : raw) };

    // Don't render if disabled or no title
    if (!promo.enabled || !promo.title) return null;

    const handleCTAClick = () => {
        if (!user && onBookNow) {
            onBookNow();
            return;
        }
        navigate(promo.cta_link || '/appointments');
    };

    return (
        <section style={{
            ...styles.section,
            backgroundColor: promo.bg_color || '#5D4037',
        }}>
            {/* Decorative circles */}
            <div style={styles.decorCircle1}></div>
            <div style={styles.decorCircle2}></div>

            <div className="container" style={styles.container}>
                <div style={styles.contentBox}>
                    {/* Label */}
                    <span style={{
                        ...styles.label,
                        backgroundColor: promo.accent_color || '#FFD700',
                        color: promo.bg_color || '#5D4037',
                    }}>
                        ✨ LIMITED OFFER
                    </span>

                    {/* Title */}
                    <h2 style={styles.title}>{promo.title}</h2>

                    {/* Subtitle */}
                    {promo.subtitle && (
                        <p style={{
                            ...styles.subtitle,
                            color: promo.accent_color || '#FFD700',
                        }}>
                            {promo.subtitle}
                        </p>
                    )}

                    {/* Date range */}
                    {promo.date_range && (
                        <p style={styles.dateRange}>📅 {promo.date_range}</p>
                    )}

                    {/* Description */}
                    {promo.description && (
                        <p style={styles.body}>{promo.description}</p>
                    )}

                    {/* Offers list */}
                    {promo.offers && promo.offers.length > 0 && (
                        <div style={styles.offersContainer}>
                            {promo.offers.map((offer, idx) => (
                                <div key={idx} style={styles.offerItem}>
                                    <span style={{
                                        ...styles.offerBullet,
                                        backgroundColor: promo.accent_color || '#FFD700',
                                        color: promo.bg_color || '#5D4037',
                                    }}>✓</span>
                                    <span>{offer}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* CTA Button */}
                    {promo.cta_text && (
                        <div style={styles.ctaContainer}>
                            <button
                                style={{
                                    ...styles.ctaBtn,
                                    backgroundColor: promo.accent_color || '#FFD700',
                                    color: promo.bg_color || '#5D4037',
                                }}
                                onClick={handleCTAClick}
                                className="promo-cta-btn"
                            >
                                {promo.cta_text}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};

const styles = {
    section: {
        position: 'relative',
        padding: '80px 0',
        color: '#fff',
        overflow: 'hidden',
        textAlign: 'center',
    },
    decorCircle1: {
        position: 'absolute',
        top: '-60px',
        right: '-60px',
        width: '200px',
        height: '200px',
        borderRadius: '50%',
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    decorCircle2: {
        position: 'absolute',
        bottom: '-40px',
        left: '-40px',
        width: '160px',
        height: '160px',
        borderRadius: '50%',
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    container: {
        maxWidth: '900px',
        margin: '0 auto',
        padding: '0 20px',
        position: 'relative',
        zIndex: 1,
    },
    contentBox: {
        border: '2px solid rgba(255,255,255,0.2)',
        borderRadius: '16px',
        padding: '50px 40px',
        backdropFilter: 'blur(5px)',
        backgroundColor: 'rgba(0,0,0,0.15)',
    },
    label: {
        display: 'inline-block',
        padding: '6px 18px',
        borderRadius: '20px',
        fontWeight: '700',
        fontSize: '0.8rem',
        letterSpacing: '1px',
        marginBottom: '20px',
    },
    title: {
        fontFamily: 'var(--font-heading-poppins)',
        fontSize: '2.5rem',
        fontWeight: '800',
        marginBottom: '10px',
        letterSpacing: '1px',
        textTransform: 'uppercase',
        textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
    },
    subtitle: {
        fontFamily: 'var(--font-heading-montserrat)',
        fontSize: '1.3rem',
        fontWeight: '600',
        marginBottom: '15px',
    },
    dateRange: {
        fontSize: '0.95rem',
        opacity: 0.8,
        marginBottom: '20px',
    },
    body: {
        fontFamily: 'var(--font-body-inter)',
        fontSize: '1.05rem',
        lineHeight: '1.6',
        marginBottom: '25px',
        maxWidth: '600px',
        marginLeft: 'auto',
        marginRight: 'auto',
        opacity: 0.9,
    },
    offersContainer: {
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        maxWidth: '500px',
        margin: '0 auto 30px',
        textAlign: 'left',
    },
    offerItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        fontSize: '1rem',
        fontFamily: 'var(--font-body-inter)',
    },
    offerBullet: {
        width: '24px',
        height: '24px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '12px',
        fontWeight: '700',
        flexShrink: 0,
    },
    ctaContainer: {
        marginTop: '10px',
    },
    ctaBtn: {
        padding: '14px 40px',
        fontSize: '1.05rem',
        fontWeight: '700',
        border: 'none',
        borderRadius: '30px',
        cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s',
        boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
    },
};

// Inject hover
const ss = document.createElement("style");
ss.innerText = `
    .promo-cta-btn:hover {
        transform: scale(1.05);
        box-shadow: 0 6px 15px rgba(0,0,0,0.3);
    }
`;
document.head.appendChild(ss);

export default PromoSection;
