import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSiteSettings } from '../context/SiteSettingsContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import checkUpBg from '../../assets/check-up.jpg';
import axios from 'axios';
import api from '../../config/api.config';

const DEFAULT_CONFIG = {
    layout: 'cards',       // 'cards' or 'list'
    show_prices: true,
    show_descriptions: true,
    page_title: 'Our Services',
    page_subtitle: 'Choose your preferred consultation method',
};

const Services = ({ hideNavFooter = false }) => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const { getSetting } = useSiteSettings();

    const raw = getSetting('services_page_settings', DEFAULT_CONFIG);
    const config = { ...DEFAULT_CONFIG, ...(typeof raw === 'string' ? JSON.parse(raw) : raw) };

    useEffect(() => { fetchServices(); }, []);

    const fetchServices = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${api.BASE_URL}/services`);
            const servicesData = response.data.data || response.data || [];
            setServices(servicesData);
        } catch (error) {
            console.error('Error fetching services:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleServiceClick = (service) => {
        if (!user) { setShowLoginModal(true); return; }
        const serviceId = service.service_id || service.id;
        navigate(`/appointments?service=${serviceId}`);
    };

    const renderCards = () => (
        <div className="services-grid" style={styles.servicesGrid}>
            {services.map((service) => (
                <div key={service.service_id || service.id} style={styles.serviceCard} onClick={() => handleServiceClick(service)}>
                    <div style={styles.serviceIcon}>🏥</div>
                    <h3 style={styles.serviceTitle}>{service.name}</h3>
                    {config.show_descriptions && <p style={styles.serviceDescription}>{service.description}</p>}
                    {config.show_prices && <p style={styles.servicePrice}>₱{parseFloat(service.price || 0).toFixed(2)}</p>}
                    <button style={styles.selectButton}>Book Now</button>
                </div>
            ))}
        </div>
    );

    const renderList = () => (
        <div style={styles.listContainer}>
            {services.map((service) => (
                <div key={service.service_id || service.id} className="services-list-item" style={styles.listItem} onClick={() => handleServiceClick(service)}>
                    <div style={styles.listLeft}>
                        <div style={styles.listIcon}>🏥</div>
                        <div>
                            <h3 style={styles.listTitle}>{service.name}</h3>
                            {config.show_descriptions && <p style={styles.listDesc}>{service.description}</p>}
                        </div>
                    </div>
                    <div className="services-list-right" style={styles.listRight}>
                        {config.show_prices && <span style={styles.listPrice}>₱{parseFloat(service.price || 0).toFixed(2)}</span>}
                        <button style={styles.listBtn}>Book Now</button>
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <div>
            {!hideNavFooter && <Navbar />}
            <div className="services-header" style={styles.header}>
                <div style={styles.overlay}></div>
                <div className="container" style={styles.container}>
                    <h1 style={styles.title}>{config.page_title}</h1>
                    <p style={styles.subtitle}>{config.page_subtitle}</p>
                </div>
            </div>

            <div className="container services-content" style={styles.contentContainer}>
                {loading ? (
                    <div style={styles.loadingContainer}><p>Loading services...</p></div>
                ) : (
                    config.layout === 'list' ? renderList() : renderCards()
                )}
            </div>

            {showLoginModal && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalContent}>
                        <h3 style={styles.modalTitle}>Login Required</h3>
                        <p style={styles.modalMessage}>Please log in to book an appointment.</p>
                        <div style={styles.modalButtons}>
                            <button style={styles.modalCancelButton} onClick={() => setShowLoginModal(false)}>Cancel</button>
                            <button style={styles.modalConfirmButton} onClick={() => navigate('/login')}>Go to Login</button>
                        </div>
                    </div>
                </div>
            )}

            {!hideNavFooter && <Footer />}
        </div>
    );
};

const styles = {
    header: {
        backgroundImage: `url(${checkUpBg})`, backgroundSize: 'cover', backgroundPosition: 'center',
        height: '300px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
    },
    overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(93, 64, 55, 0.7)' },
    container: { position: 'relative', zIndex: 1, textAlign: 'center' },
    title: { fontSize: '3rem', fontWeight: '700', color: 'white', marginBottom: '10px', fontFamily: 'var(--font-heading-playfair)' },
    subtitle: { fontSize: '1.2rem', color: 'white', fontFamily: 'var(--font-body-inter)' },
    contentContainer: { padding: '60px 20px', maxWidth: '1200px', margin: '0 auto' },
    loadingContainer: { textAlign: 'center', padding: '40px', fontSize: '1.2rem', color: '#666' },

    // Card Layout
    servicesGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px', padding: '20px 0' },
    serviceCard: {
        backgroundColor: 'white', borderRadius: '12px', padding: '40px 30px', textAlign: 'center',
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)', cursor: 'pointer', transition: 'all 0.3s ease', border: '2px solid transparent',
    },
    serviceIcon: { fontSize: '4rem', marginBottom: '20px' },
    serviceTitle: { fontSize: '1.5rem', fontWeight: '600', color: 'var(--color-dark-brown)', marginBottom: '15px', fontFamily: 'var(--font-heading-playfair)' },
    serviceDescription: { fontSize: '1rem', color: '#666', marginBottom: '15px', lineHeight: '1.6', fontFamily: 'var(--font-body-inter)' },
    servicePrice: { fontSize: '1.3rem', fontWeight: '700', color: 'var(--color-dark-brown)', marginBottom: '20px', fontFamily: 'var(--font-body-inter)' },
    selectButton: {
        backgroundColor: 'var(--color-dark-brown)', color: 'white', border: 'none', padding: '12px 30px',
        borderRadius: '6px', fontSize: '1rem', fontWeight: '600', cursor: 'pointer', fontFamily: 'var(--font-body-inter)',
    },

    // List Layout
    listContainer: { display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px 0' },
    listItem: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white',
        borderRadius: '12px', padding: '24px 30px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
        cursor: 'pointer', transition: 'all 0.3s ease', border: '1px solid #eee',
    },
    listLeft: { display: 'flex', alignItems: 'center', gap: '20px', flex: 1 },
    listIcon: { fontSize: '2rem', flexShrink: 0 },
    listTitle: { fontSize: '1.2rem', fontWeight: '600', color: 'var(--color-dark-brown)', marginBottom: '5px', fontFamily: 'var(--font-heading-playfair)' },
    listDesc: { fontSize: '0.9rem', color: '#666', fontFamily: 'var(--font-body-inter)', lineHeight: '1.4' },
    listRight: { display: 'flex', alignItems: 'center', gap: '20px', flexShrink: 0 },
    listPrice: { fontSize: '1.2rem', fontWeight: '700', color: 'var(--color-dark-brown)', fontFamily: 'var(--font-body-inter)' },
    listBtn: {
        backgroundColor: 'var(--color-dark-brown)', color: 'white', border: 'none', padding: '10px 24px',
        borderRadius: '6px', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer', fontFamily: 'var(--font-body-inter)',
    },

    // Modal
    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000 },
    modalContent: { backgroundColor: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', maxWidth: '400px', width: '90%', textAlign: 'center' },
    modalTitle: { fontSize: '1.5rem', fontWeight: '600', color: 'var(--color-dark-brown)', marginBottom: '15px', fontFamily: 'var(--font-heading-playfair)' },
    modalMessage: { fontSize: '1rem', color: '#666', marginBottom: '25px', fontFamily: 'var(--font-body-inter)' },
    modalButtons: { display: 'flex', gap: '15px', justifyContent: 'center' },
    modalCancelButton: { backgroundColor: '#f0f0f0', color: '#333', border: 'none', padding: '10px 30px', borderRadius: '6px', cursor: 'pointer', fontFamily: 'var(--font-body-inter)', fontWeight: '500', fontSize: '1rem' },
    modalConfirmButton: { backgroundColor: 'var(--color-dark-brown)', color: 'white', border: 'none', padding: '10px 30px', borderRadius: '6px', cursor: 'pointer', fontFamily: 'var(--font-body-inter)', fontWeight: '600', fontSize: '1rem' },
};

export default Services;
