import React from 'react';
import { FaFacebookF, FaInstagram, FaTiktok, FaYoutube } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { useSiteSettings } from '../context/SiteSettingsContext';

const Footer = () => {
    const { getSetting } = useSiteSettings();

    const clinicName = getSetting('clinic_name', 'Doctor EC Optical Clinic');
    const aboutText = getSetting('about_text', 'We are dedicated to providing the best optical care through advanced technology and personalized service. Your vision is our priority.');
    const address = getSetting('clinic_address', 'Strong Republic Nautical Highway, Roxas, Oriental Mindoro, Philippines, 5212');
    const phone = getSetting('clinic_phone', '0926 432 1826 (Globe) / 0962-5072-580 (Smart)');
    const email = getSetting('clinic_email', 'doctorecopticalclinic@gmail.com');
    const facebook = getSetting('social_facebook', 'https://www.facebook.com/doctorecopticalclinic');
    const instagram = getSetting('social_instagram', '');
    const tiktok = getSetting('social_tiktok', '');
    const youtube = getSetting('social_youtube', '');

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const socialLinks = [
        { url: facebook, icon: <FaFacebookF />, name: 'Facebook' },
        { url: instagram, icon: <FaInstagram />, name: 'Instagram' },
        { url: tiktok, icon: <FaTiktok />, name: 'TikTok' },
        { url: youtube, icon: <FaYoutube />, name: 'YouTube' },
    ].filter(s => s.url); // Only show social links that have URLs

    return (
        <footer style={styles.footer}>
            <div className="container footer-container" style={styles.container}>
                <div style={styles.section}>
                    <h3 style={styles.heading}>About {clinicName}</h3>
                    <p style={styles.text}>{aboutText}</p>
                </div>

                <div style={styles.section}>
                    <h3 style={styles.heading}>Quick Links</h3>
                    <ul style={styles.list}>
                        <li><Link to="/" className="footer-link" style={styles.link} onClick={scrollToTop}>Home</Link></li>
                        <li><Link to="/appointments" className="footer-link" style={styles.link} onClick={scrollToTop}>Appointments</Link></li>
                        <li><Link to="/products" className="footer-link" style={styles.link} onClick={scrollToTop}>Products</Link></li>

                    </ul>
                </div>

                <div style={styles.section}>
                    <h3 style={styles.heading}>Contact Us</h3>
                    <p style={styles.text}>{address}</p>
                    <p style={styles.text}>Phone: {phone}</p>
                    <p style={styles.text}>
                        Email: <a href={`mailto:${email}`} style={{ color: 'inherit', textDecoration: 'none' }}>{email}</a>
                    </p>
                </div>

                {socialLinks.length > 0 && (
                    <div style={styles.section}>
                        <h3 style={styles.heading}>Follow Us</h3>
                        <div style={styles.socialIcons}>
                            {socialLinks.map((s, i) => (
                                <a key={i} href={s.url} target="_blank" rel="noopener noreferrer"
                                    style={styles.icon} title={s.name}>
                                    {s.icon}
                                </a>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            <div style={styles.bottomBar}>
                <p>&copy; {new Date().getFullYear()} {clinicName}. All rights reserved.</p>
            </div>
        </footer>
    );
};

const styles = {
    footer: {
        backgroundColor: 'var(--color-dark-brown)',
        color: '#D7CCC8',
        paddingTop: '60px',
    },
    container: {
        maxWidth: 'var(--max-width)',
        margin: '0 auto',
        padding: '0 20px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '40px',
        paddingBottom: '40px',
    },
    section: { display: 'flex', flexDirection: 'column' },
    heading: {
        fontFamily: 'var(--font-heading-montserrat)',
        fontSize: '1.1rem',
        color: 'var(--color-white)',
        marginBottom: '20px',
        fontWeight: '600',
    },
    text: {
        fontFamily: 'var(--font-body-inter)',
        fontSize: '0.9rem',
        lineHeight: '1.6',
        marginBottom: '10px',
    },
    list: { listStyle: 'none', padding: 0 },
    link: {
        color: '#D7CCC8',
        textDecoration: 'none',
        fontFamily: 'var(--font-body-inter)',
        fontSize: '0.9rem',
        marginBottom: '10px',
        display: 'block',
        transition: 'color 0.2s ease',
    },
    socialIcons: { display: 'flex', gap: '15px' },
    icon: {
        color: '#D7CCC8',
        fontSize: '1.2rem',
        transition: 'color 0.2s ease',
        backgroundColor: 'rgba(255,255,255,0.1)',
        padding: '10px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '40px',
        height: '40px',
    },
    bottomBar: {
        borderTop: '1px solid #5D4037',
        padding: '20px 0',
        textAlign: 'center',
        fontFamily: 'var(--font-body-inter)',
        fontSize: '0.85rem',
        color: '#A1887F',
    },
};

const styleSheet = document.createElement("style");
styleSheet.innerText = `
    .footer-link:hover {
        color: #fff !important;
        padding-left: 5px;
    }
`;
document.head.appendChild(styleSheet);

export default Footer;
