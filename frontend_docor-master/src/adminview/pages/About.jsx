import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

// Import Images
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

const About = () => {
    const openingImages = [opening1, opening2, opening3, opening4, opening5];
    const patientImages = [patient1, patient2, patient3, patient4, patient5, patient6, patient7, patient8, patient9, patient10];

    return (
        <div style={styles.pageWrapper}>

            {/* Hero Section with Blur Background */}
            <div style={styles.heroSection}>
                <div style={styles.heroOverlay}></div>
                <div className="container" style={styles.heroContent}>
                    <h1 style={styles.heroTitle}>About Us</h1>
                    <p style={styles.heroSubtitle}>Dedicated to providing the best eye care for you and your family.</p>
                </div>
            </div>

            <div className="container" style={styles.contentContainer}>
                {/* Mission & Vision */}
                <section style={styles.section}>
                    <div style={styles.grid}>
                        <div style={styles.card}>
                            <h2 style={styles.cardTitle}>Our Mission</h2>
                            <p style={styles.cardText}>
                                To provide accessible, high-quality, and personalized eye care services to our community, ensuring that every patient achieves their best possible vision and eye health.
                            </p>
                        </div>
                        <div style={styles.card}>
                            <h2 style={styles.cardTitle}>Our Vision</h2>
                            <p style={styles.cardText}>
                                To be the leading optical clinic in the region, recognized for our commitment to excellence, innovation in eye care, and dedication to patient satisfaction.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Grand Opening Section */}
                <section style={styles.section}>
                    <h2 style={styles.sectionTitle}>Our Grand Opening</h2>
                    <div style={styles.imageGrid}>
                        {openingImages.map((img, index) => (
                            <div key={index} style={styles.imageItem}>
                                <img src={img} alt={`Grand Opening ${index + 1}`} style={styles.galleryImage} />
                            </div>
                        ))}
                    </div>
                </section>

                {/* Happy Patients Section */}
                <section style={styles.section}>
                    <h2 style={styles.sectionTitle}>Our Happy Patients</h2>
                    <div style={styles.imageGrid}>
                        {patientImages.map((img, index) => (
                            <div key={index} style={styles.imageItem}>
                                <img src={img} alt={`Happy Patient ${index + 1}`} style={styles.galleryImage} />
                            </div>
                        ))}
                    </div>
                    <div style={styles.facebookLinkContainer}>
                        <p style={styles.facebookText}>See more happy smiles on our Facebook Page:</p>
                        <a
                            href="https://www.facebook.com/doctorecopticalclinic/photos"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={styles.facebookLink}
                        >
                            Visit Facebook Page
                        </a>
                    </div>
                </section>

                {/* Our Services */}
                <section style={styles.section}>
                    <h2 style={styles.sectionTitle}>Our Services</h2>
                    <div style={styles.servicesContainer}>
                        <ul style={styles.servicesList}>
                            <li>Free computerized eye check-up</li>
                            <li>Affordable set of eyeglasses</li>
                            <li>Anti-radiation lenses</li>
                            <li>Transitions/photochromic lenses</li>
                            <li>Tinted/colored lenses</li>
                            <li>Double vista lenses</li>
                            <li>Progressive lenses</li>
                            <li>Contact lenses</li>
                            <li>Color vision test / Ishihara test</li>
                            <li>Eyeglasses repairs</li>
                        </ul>
                        <p style={styles.serviceNote}>
                            <strong>We make eyeglasses while you wait: 15-20 minutes</strong>
                        </p>
                    </div>
                </section>

                {/* Contact Details & Map */}
                <section style={styles.section}>
                    <h2 style={styles.sectionTitle}>Contact Details</h2>
                    <div style={styles.contactContainer}>
                        <div style={styles.mapWrapper}>
                            <iframe
                                title="Clinic Location"
                                src="https://maps.google.com/maps?q=Strong+Republic+Nautical+Highway,+Roxas,+Philippines,+5212&t=&z=15&ie=UTF8&iwloc=&output=embed"
                                width="100%"
                                height="300"
                                style={{ border: 0 }}
                                allowFullScreen=""
                                loading="lazy"
                            ></iframe>
                        </div>
                        <div style={styles.contactInfo}>
                            <h3 style={styles.subTitle}>Visit Us</h3>
                            <p style={styles.text}>
                                <strong>Address:</strong><br />
                                Strong Republic Nautical Highway,<br />
                                Roxas, Philippines, 5212
                            </p>
                            <p style={styles.text}>
                                <strong>Clinic Schedule:</strong><br />
                                9:00 AM to 5:30 PM<br />
                                SUNDAY to FRIDAY<br />
                                CLOSED Every SATURDAY
                            </p>
                            <p style={styles.text}>
                                <strong>Contact Numbers:</strong><br />
                                0926-4321-826 (Globe)<br />
                                0962-5072-580 (Smart)
                            </p>
                            <p style={styles.text}>
                                <strong>Email:</strong><br />
                                doctorecopticalclinic@gmail.com
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};

const styles = {
    pageWrapper: {
        position: 'relative',
        minHeight: '100vh',
    },
    heroSection: {
        position: 'relative',
        height: '400px',
        backgroundImage: `url(${coverImg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
    },
    heroOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(5px)', // Blur effect on the hero image
        WebkitBackdropFilter: 'blur(5px)',
    },
    heroContent: {
        position: 'relative',
        zIndex: 1,
        color: '#fff',
    },
    heroTitle: {
        fontFamily: 'var(--font-heading-poppins)',
        fontSize: '3.5rem',
        marginBottom: '15px',
        color: '#FAF0CA',
        textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
    },
    heroSubtitle: {
        fontFamily: 'var(--font-body-inter)',
        fontSize: '1.2rem',
        maxWidth: '600px',
        margin: '0 auto',
    },
    contentContainer: {
        maxWidth: 'var(--max-width)',
        margin: '60px auto',
        padding: '0 20px',
    },
    section: {
        marginBottom: '80px',
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '30px',
    },
    card: {
        backgroundColor: 'var(--color-white)',
        padding: '30px',
        borderRadius: 'var(--border-radius)',
        boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
        textAlign: 'center',
    },
    cardTitle: {
        fontFamily: 'var(--font-heading-montserrat)',
        fontSize: '1.5rem',
        color: 'var(--color-dark-brown)',
        marginBottom: '15px',
    },
    cardText: {
        fontFamily: 'var(--font-body-inter)',
        color: 'var(--color-text-secondary)',
        lineHeight: '1.6',
    },
    sectionTitle: {
        fontFamily: 'var(--font-heading-montserrat)',
        fontSize: '2rem',
        color: 'var(--color-dark-brown)',
        marginBottom: '40px',
        textAlign: 'center',
        position: 'relative',
    },
    imageGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '15px',
    },
    imageItem: {
        borderRadius: '10px',
        overflow: 'hidden',
        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
        height: '200px',
    },
    galleryImage: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        transition: 'transform 0.3s ease',
        cursor: 'pointer',
    },
    facebookLinkContainer: {
        textAlign: 'center',
        marginTop: '30px',
    },
    facebookText: {
        fontSize: '1.1rem',
        color: 'var(--color-text-secondary)',
        marginBottom: '10px',
    },
    facebookLink: {
        display: 'inline-block',
        backgroundColor: '#1877F2', // Facebook Blue
        color: '#fff',
        padding: '10px 20px',
        borderRadius: '20px',
        textDecoration: 'none',
        fontWeight: 'bold',
        transition: 'background-color 0.2s',
    },
    servicesContainer: {
        backgroundColor: 'var(--color-white)',
        padding: '30px',
        borderRadius: 'var(--border-radius)',
        boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
        maxWidth: '800px',
        margin: '0 auto',
    },
    servicesList: {
        listStyleType: 'disc',
        paddingLeft: '20px',
        marginBottom: '20px',
        fontFamily: 'var(--font-body-inter)',
        color: 'var(--color-text-secondary)',
        lineHeight: '1.8',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '10px',
    },
    serviceNote: {
        fontFamily: 'var(--font-body-inter)',
        fontSize: '1.1rem',
        color: 'var(--color-dark-brown)',
        textAlign: 'center',
        marginTop: '20px',
    },
    contactContainer: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '50px',
        backgroundColor: 'var(--color-white)',
        padding: '30px',
        borderRadius: 'var(--border-radius)',
        boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
    },
    contactInfo: {
        fontFamily: 'var(--font-body-inter)',
        color: 'var(--color-text-secondary)',
    },
    subTitle: {
        fontFamily: 'var(--font-heading-montserrat)',
        fontSize: '1.3rem',
        color: 'var(--color-dark-brown)',
        marginBottom: '20px',
    },
    text: {
        marginBottom: '20px',
        lineHeight: '1.6',
    },
    mapWrapper: {
        borderRadius: 'var(--border-radius)',
        overflow: 'hidden',
        height: '100%',
        minHeight: '300px',
    },
};

// Inject hover styles
const styleSheet = document.createElement("style");
styleSheet.innerText = `
    .imageItem:hover .galleryImage {
        transform: scale(1.1);
    }
    .facebookLink:hover {
        background-color: #145dbf;
    }
`;
document.head.appendChild(styleSheet);

export default About;
