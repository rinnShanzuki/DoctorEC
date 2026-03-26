import React from 'react';
import { useSiteSettings } from '../context/SiteSettingsContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

// Import default images (used as fallbacks)
import coverImg from '../../assets/docec-cover2.jpg';
import opening1 from '../../assets/docec-opening1.jpg';
import opening2 from '../../assets/docec-opening2.jpg';
import opening3 from '../../assets/docec-opening3.jpg';
import opening4 from '../../assets/docec-opening4.jpg';
import opening5 from '../../assets/docec-opening5.jpg';

import patient1 from '../../assets/patient1.jpg';
import patient2 from '../../assets/patient2.jpg';
import patient3 from '../../assets/patient3.jpg';
import patient4 from '../../assets/patient4.jpg';
import patient5 from '../../assets/patient5.jpg';
import patient6 from '../../assets/patient6.jpg';
import patient7 from '../../assets/patient7.jpg';
import patient8 from '../../assets/patient8.jpg';
import patient9 from '../../assets/patient9.jpg';
import patient10 from '../../assets/patient10.jpg';

const DEFAULT_ABOUT = {
    mission_text: 'To provide accessible, high-quality, and personalized eye care services to our community, ensuring that every patient achieves their best possible vision and eye health.',
    vision_text: 'To be the leading optical clinic in the region, recognized for our commitment to excellence, innovation in eye care, and dedication to patient satisfaction.',
    services_list: [
        'Free computerized eye check-up', 'Affordable set of eyeglasses',
        'Anti-radiation lenses', 'Transitions/photochromic lenses',
        'Tinted/colored lenses', 'Double vista lenses',
        'Progressive lenses', 'Contact lenses',
        'Color vision test / Ishihara test', 'Eye wash', 'Eyeglasses repairs',
    ],
    service_note: 'We make eyeglasses while you wait: 15-20 minutes',
    show_gallery: true,
    show_map: true,
};

const About = ({ hideNavFooter = false }) => {
    const { getSetting } = useSiteSettings();

    const raw = getSetting('about_page_settings', DEFAULT_ABOUT);
    const config = { ...DEFAULT_ABOUT, ...(typeof raw === 'string' ? JSON.parse(raw) : raw) };

    // Read shared clinic info from settings
    const clinicName = getSetting('clinic_name', 'Doctor EC Optical Clinic');
    const address = getSetting('clinic_address', 'Strong Republic Nautical Highway, Roxas, Oriental Mindoro, Philippines, 5212');
    const phone = getSetting('clinic_phone', '0926 432 1826 (Globe) / 0962-5072-580 (Smart)');
    const email = getSetting('clinic_email', 'doctorecopticalclinic@gmail.com');
    const facebook = getSetting('social_facebook', 'https://www.facebook.com/doctorecopticalclinic');

    const openingImages = [opening1, opening2, opening3, opening4, opening5];
    const patientImages = [patient1, patient2, patient3, patient4, patient5, patient6, patient7, patient8, patient9, patient10];

    return (
        <div style={styles.pageWrapper}>
            {!hideNavFooter && <Navbar />}

            {/* Hero Section */}
            <div className="about-hero" style={styles.heroSection}>
                <div style={styles.heroOverlay}></div>
                <div className="container" style={styles.heroContent}>
                    <h1 style={styles.heroTitle}>About Us</h1>
                    <p style={styles.heroSubtitle}>Dedicated to providing the best eye care for you and your family.</p>
                </div>
            </div>

            <div className="container about-content" style={styles.contentContainer}>
                {/* Mission & Vision */}
                <section className="about-section" style={styles.section}>
                    <div style={styles.grid}>
                        <div className="about-card" style={styles.card}>
                            <h2 className="about-card-title" style={styles.cardTitle}>Our Mission</h2>
                            <p style={styles.cardText}>{config.mission_text}</p>
                        </div>
                        <div className="about-card" style={styles.card}>
                            <h2 className="about-card-title" style={styles.cardTitle}>Our Vision</h2>
                            <p style={styles.cardText}>{config.vision_text}</p>
                        </div>
                    </div>
                </section>

                {/* Gallery - Grand Opening */}
                {config.show_gallery && (
                    <>
                        <section style={styles.section}>
                            <h2 className="about-section-title" style={styles.sectionTitle}>Our Grand Opening</h2>
                            <div className="about-image-grid" style={styles.imageGrid}>
                                {openingImages.map((img, index) => (
                                    <div key={index} className="about-image-item" style={styles.imageItem}>
                                        <img src={img} alt={`Grand Opening ${index + 1}`} style={styles.galleryImage} />
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section style={styles.section}>
                            <h2 className="about-section-title" style={styles.sectionTitle}>Our Happy Patients</h2>
                            <div className="about-image-grid" style={styles.imageGrid}>
                                {patientImages.map((img, index) => (
                                    <div key={index} className="about-image-item" style={styles.imageItem}>
                                        <img src={img} alt={`Happy Patient ${index + 1}`} style={styles.galleryImage} />
                                    </div>
                                ))}
                            </div>
                            {facebook && (
                                <div style={styles.facebookLinkContainer}>
                                    <p style={styles.facebookText}>See more happy smiles on our Facebook Page:</p>
                                    <a href={`${facebook}/photos`} target="_blank" rel="noopener noreferrer" style={styles.facebookLink}>
                                        Visit Facebook Page
                                    </a>
                                </div>
                            )}
                        </section>
                    </>
                )}

                {/* Our Services */}
                {config.services_list && config.services_list.length > 0 && (
                    <section style={styles.section}>
                        <h2 className="about-section-title" style={styles.sectionTitle}>Our Services</h2>
                        <div className="about-services-container" style={styles.servicesContainer}>
                            <ul className="about-services-list" style={styles.servicesList}>
                                {config.services_list.map((svc, idx) => (
                                    <li key={idx}>{svc}</li>
                                ))}
                            </ul>
                            {config.service_note && (
                                <p style={styles.serviceNote}><strong>{config.service_note}</strong></p>
                            )}
                        </div>
                    </section>
                )}

                {/* Contact Details & Map */}
                <section style={styles.section}>
                    <h2 style={styles.sectionTitle}>Contact Details</h2>
                    <div className="about-contact-container" style={styles.contactContainer}>
                        {config.show_map && (
                            <div style={styles.mapWrapper}>
                                <iframe
                                    title="Clinic Location"
                                    src={`https://maps.google.com/maps?q=${encodeURIComponent(address)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                                    width="100%" height="300"
                                    style={{ border: 0 }} allowFullScreen="" loading="lazy"
                                ></iframe>
                            </div>
                        )}
                        <div style={styles.contactInfo}>
                            <h3 style={styles.subTitle}>Visit Us</h3>
                            <p style={styles.text}><strong>Address:</strong><br />{address}</p>
                            <p style={styles.text}><strong>Contact Numbers:</strong><br />{phone}</p>
                            <p style={styles.text}><strong>Email:</strong><br />{email}</p>
                        </div>
                    </div>
                </section>
            </div>
            {!hideNavFooter && <Footer />}
        </div>
    );
};

const styles = {
    pageWrapper: { position: 'relative', minHeight: '100vh' },
    heroSection: {
        position: 'relative', height: '400px', backgroundImage: `url(${coverImg})`,
        backgroundSize: 'cover', backgroundPosition: 'center',
        display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center',
    },
    heroOverlay: {
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(5px)', WebkitBackdropFilter: 'blur(5px)',
    },
    heroContent: { position: 'relative', zIndex: 1, color: '#fff' },
    heroTitle: {
        fontFamily: 'var(--font-heading-poppins)', fontSize: '3.5rem', marginBottom: '15px',
        color: '#FAF0CA', textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
    },
    heroSubtitle: { fontFamily: 'var(--font-body-inter)', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto' },
    contentContainer: { maxWidth: 'var(--max-width)', margin: '60px auto', padding: '0 20px' },
    section: { marginBottom: '80px' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' },
    card: {
        backgroundColor: 'var(--color-white)', padding: '30px', borderRadius: 'var(--border-radius)',
        boxShadow: '0 4px 6px rgba(0,0,0,0.05)', textAlign: 'center',
    },
    cardTitle: { fontFamily: 'var(--font-heading-montserrat)', fontSize: '1.5rem', color: 'var(--color-dark-brown)', marginBottom: '15px' },
    cardText: { fontFamily: 'var(--font-body-inter)', color: 'var(--color-text-secondary)', lineHeight: '1.6' },
    sectionTitle: {
        fontFamily: 'var(--font-heading-montserrat)', fontSize: '2rem', color: 'var(--color-dark-brown)',
        marginBottom: '40px', textAlign: 'center',
    },
    imageGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' },
    imageItem: { borderRadius: '10px', overflow: 'hidden', boxShadow: '0 4px 8px rgba(0,0,0,0.1)', height: '200px' },
    galleryImage: { width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease', cursor: 'pointer' },
    facebookLinkContainer: { textAlign: 'center', marginTop: '30px' },
    facebookText: { fontSize: '1.1rem', color: 'var(--color-text-secondary)', marginBottom: '10px' },
    facebookLink: {
        display: 'inline-block', backgroundColor: '#1877F2', color: '#fff',
        padding: '10px 20px', borderRadius: '20px', textDecoration: 'none', fontWeight: 'bold',
    },
    servicesContainer: {
        backgroundColor: 'var(--color-white)', padding: '30px', borderRadius: 'var(--border-radius)',
        boxShadow: '0 4px 6px rgba(0,0,0,0.05)', maxWidth: '800px', margin: '0 auto',
    },
    servicesList: {
        listStyleType: 'disc', paddingLeft: '20px', marginBottom: '20px',
        fontFamily: 'var(--font-body-inter)', color: 'var(--color-text-secondary)', lineHeight: '1.8',
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '10px',
    },
    serviceNote: { fontFamily: 'var(--font-body-inter)', fontSize: '1.1rem', color: 'var(--color-dark-brown)', textAlign: 'center', marginTop: '20px' },
    contactContainer: {
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '50px',
        backgroundColor: 'var(--color-white)', padding: '30px', borderRadius: 'var(--border-radius)',
        boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
    },
    contactInfo: { fontFamily: 'var(--font-body-inter)', color: 'var(--color-text-secondary)' },
    subTitle: { fontFamily: 'var(--font-heading-montserrat)', fontSize: '1.3rem', color: 'var(--color-dark-brown)', marginBottom: '20px' },
    text: { marginBottom: '20px', lineHeight: '1.6' },
    mapWrapper: { borderRadius: 'var(--border-radius)', overflow: 'hidden', height: '100%', minHeight: '300px' },
};

export default About;
