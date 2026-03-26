import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSiteSettings } from '../context/SiteSettingsContext';
import API_CONFIG from '../../config/api.config';

const resolveUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http') || url.startsWith('data:') || url.startsWith('blob:')) return url;
    const base = API_CONFIG.BASE_URL.replace('/api/v1', '');
    return `${base}${url}`;
};

const DEFAULT_PROMO = {
    enabled: false,
    cta_link: '/appointments',
};

const PromoSection = ({ onBookNow, promoProps, bgImage: propBgImage }) => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { getSetting } = useSiteSettings();

    // Prioritize props from SiteEditor live preview
    const raw = promoProps || getSetting('promo_settings', DEFAULT_PROMO);
    const promo = { ...DEFAULT_PROMO, ...(typeof raw === 'string' ? JSON.parse(raw) : raw) };
    
    const settingsBgImage = getSetting('promo_bg_image', '');
    const activeBgImage = propBgImage || (settingsBgImage ? resolveUrl(settingsBgImage) : '');

    // Don't render if disabled
    if (!promo.enabled) return null;

    const handleCTAClick = () => {
        if (!user && onBookNow && (!promo.cta_link || promo.cta_link === '/appointments')) {
            onBookNow();
            return;
        }
        navigate(promo.cta_link || '/appointments');
    };

    return (
        <section style={styles.section} className="promo-section-container">
            <div className="container" style={styles.container}>
                {activeBgImage ? (
                    <img 
                        src={activeBgImage} 
                        alt="Promotional Offer" 
                        style={styles.image} 
                        onClick={handleCTAClick}
                        className="promo-image-hover"
                    />
                ) : (
                    <div style={styles.placeholder} onClick={handleCTAClick}>
                        <p>No promotional image uploaded yet.</p>
                    </div>
                )}
            </div>
        </section>
    );
};

const styles = {
    section: {
        padding: '60px 0',
        backgroundColor: '#fff',
    },
    container: {
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 20px',
        display: 'flex',
        justifyContent: 'center',
    },
    image: {
        width: '100%',
        height: 'auto',
        borderRadius: '16px',
        objectFit: 'contain',
        cursor: 'pointer',
        boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        display: 'block'
    },
    placeholder: {
        width: '100%',
        height: '300px',
        borderRadius: '16px',
        backgroundColor: '#f5f5f5',
        border: '2px dashed #ddd',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#888',
        fontFamily: 'var(--font-body-inter)',
        cursor: 'pointer'
    }
};

// Inject hover styles
const ss = document.createElement("style");
ss.innerText = `
    .promo-image-hover:hover {
        transform: translateY(-4px);
        box-shadow: 0 12px 40px rgba(0,0,0,0.15) !important;
    }
`;
document.head.appendChild(ss);

export default PromoSection;
