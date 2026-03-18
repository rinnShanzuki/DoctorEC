import React from 'react';
import { FaFacebookF } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const Footer = () => {
    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    return (
        <footer style={styles.footer}>
            <div className="container" style={styles.container}>
                <div style={styles.section}>
                    <h3 style={styles.heading}>About Doctor EC Optical Clinic</h3>
                    <p style={styles.text}>
                        We are dedicated to providing the best optical care through advanced technology
                        and personalized service. Your vision is our priority.
                    </p>
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
                    <p style={styles.text}>Strong Republic Nautical Highway, Roxas, Philippines, 5212</p>
                    <p style={styles.text}>Phone: 0926 432 1826 (Globe) / 0962-5072-580 (Smart)</p>
                    <p style={styles.text}>
                        Email: <a href="mailto:doctorecopticalclinic@gmail.com" style={{ color: 'inherit', textDecoration: 'none' }}>doctorecopticalclinic@gmail.com</a>
                    </p>
                </div>

                <div style={styles.section}>
                    <h3 style={styles.heading}>Follow Us</h3>
                    <div style={styles.socialIcons}>
                        <a
                            href="https://www.facebook.com/doctorecopticalclinic"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={styles.icon}
                        >
                            <FaFacebookF />
                        </a>
                    </div>
                </div>
            </div>
            <div style={styles.bottomBar}>
                <p>&copy; {new Date().getFullYear()} Doctor EC Optical Clinic. All rights reserved.</p>
            </div>
        </footer>
    );
};

const styles = {
    footer: {
        backgroundColor: 'var(--color-dark-brown)',
        color: '#D7CCC8', // Beige text
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
    section: {
        display: 'flex',
        flexDirection: 'column',
    },
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
    list: {
        listStyle: 'none',
        padding: 0,
    },
    link: {
        color: '#D7CCC8',
        textDecoration: 'none',
        fontFamily: 'var(--font-body-inter)',
        fontSize: '0.9rem',
        marginBottom: '10px',
        display: 'block',
        transition: 'color 0.2s ease',
    },
    socialIcons: {
        display: 'flex',
        gap: '15px',
    },
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

// Inject hover styles
const styleSheet = document.createElement("style");
styleSheet.innerText = `
    .footer-link:hover {
        color: #fff !important;
        padding-left: 5px;
    }
`;
document.head.appendChild(styleSheet);

export default Footer;
