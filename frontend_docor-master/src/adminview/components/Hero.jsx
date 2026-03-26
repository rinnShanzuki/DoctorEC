import React from 'react';
import heroImage from '../../assets/docec-family.jpg';
import coverImage from '../../assets/docec-cover.jpg';
import glassNbg from '../../assets/glass-nbg.png';
import { useSiteSettings } from '../../clientside/context/SiteSettingsContext';
import API_CONFIG from '../../config/api.config';

const resolveUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http') || url.startsWith('data:') || url.startsWith('blob:')) return url;
    const base = API_CONFIG.BASE_URL.replace('/api/v1', '');
    return `${base}${url}`;
};

const Hero = ({ onSignUpClick, onBookClick, headline, subheadline, coverImage: propCoverImage, fgImage: propFgImage }) => {
    let settingsHeadline, settingsSubheadline, settingsCoverImage, settingsFgImage;
    try {
        const { getSetting } = useSiteSettings();
        settingsHeadline = getSetting('hero_headline', '');
        settingsSubheadline = getSetting('hero_subheadline', '');
        settingsCoverImage = getSetting('hero_cover_image', '');
        settingsFgImage = getSetting('hero_fg_image', '');
    } catch {
        // SiteSettingsProvider may not wrap admin routes
    }

    // Priority: props (from SiteEditor live preview) → settings (from DB) → hardcoded defaults
    const bgImage = propCoverImage || (settingsCoverImage ? resolveUrl(settingsCoverImage) : '') || coverImage;
    const fgImage = propFgImage || (settingsFgImage ? resolveUrl(settingsFgImage) : '') || glassNbg;
    const displayHeadline = headline || settingsHeadline || "Precision Care for Every Pair";
    const displaySubheadline = subheadline || settingsSubheadline || "From eye exams to treatments and prescription eyeglasses, we're here for your eye care needs.";

    const handleBookClick = () => {
        if (onBookClick) {
            onBookClick();
        } else {
            alert("You need to sign up first.");
            if (onSignUpClick) onSignUpClick();
        }
    };

    return (
        <section style={{ ...styles.hero, backgroundImage: `url(${bgImage})` }}>
            <div style={styles.overlay}></div>
            <div className="container" style={styles.container}>
                <div style={styles.content}>
                    <h1 style={styles.headline}>{displayHeadline}</h1>
                    <p style={styles.subheadline}>{displaySubheadline}</p>
                    <div style={styles.buttonGroup}>
                        <button style={styles.bookBtn} onClick={handleBookClick}>Book an Appointment</button>
                        {onSignUpClick && (
                            <button style={styles.signUpBtn} onClick={onSignUpClick}>Sign Up</button>
                        )}
                    </div>
                </div>
                <div style={styles.imageWrapper}>
                    <img src={fgImage} alt="Precision Eye Care" style={styles.image} />
                </div>
            </div>
        </section>
    );
};

const styles = {
    hero: {
        position: 'relative', backgroundImage: `url(${coverImage})`, backgroundSize: 'cover',
        backgroundPosition: 'center', padding: '180px 0', display: 'flex', alignItems: 'center', overflow: 'hidden',
    },
    overlay: {
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(255, 253, 251, 0.5)', backdropFilter: 'blur(7px)', zIndex: 1,
    },
    container: {
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '50px', alignItems: 'center',
        width: '100%', maxWidth: 'var(--max-width)', margin: '0 auto', padding: '0 20px',
        position: 'relative', zIndex: 2,
    },
    content: { maxWidth: '550px' },
    headline: { fontFamily: 'var(--font-heading-poppins)', fontSize: '3.5rem', fontWeight: '700', color: 'var(--color-dark-brown)', lineHeight: '1.2', marginBottom: '20px' },
    subheadline: { fontFamily: 'var(--font-body-inter)', fontSize: '1.1rem', color: 'var(--color-dark-brown)', marginBottom: '35px', maxWidth: '480px', fontWeight: '500' },
    buttonGroup: { display: 'flex', gap: '20px' },
    bookBtn: { backgroundColor: 'var(--color-dark-brown)', color: 'var(--color-white)', padding: '14px 32px', fontSize: '1rem', fontWeight: '500', border: 'none', borderRadius: 'var(--border-radius)', cursor: 'pointer', transition: 'all 0.2s ease' },
    signUpBtn: { backgroundColor: 'var(--color-white)', color: 'var(--color-dark-brown)', border: '2px solid var(--color-dark-brown)', padding: '14px 32px', fontSize: '1rem', fontWeight: '500', borderRadius: 'var(--border-radius)', cursor: 'pointer', transition: 'all 0.2s ease' },
    imageWrapper: { display: 'flex', justifyContent: 'center', alignItems: 'center', animation: 'float 6s ease-in-out infinite' },
    image: { maxWidth: '100%', height: 'auto', display: 'block', filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.2))' },
};

const styleSheet = document.createElement("style");
styleSheet.innerText = `@keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-15px); } }`;
document.head.appendChild(styleSheet);

export default Hero;
