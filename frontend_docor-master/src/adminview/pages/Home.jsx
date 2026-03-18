import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Hero from '../components/Hero';
import AppointmentTypes from '../components/AppointmentTypes';
import Features from '../components/Features';
import ProductPreview from '../components/ProductPreview';
import CTAStrip from '../components/CTAStrip';
import { FaEdit, FaTimes } from 'react-icons/fa';
import { contentAPI } from '../../services/api';

const Home = ({ isEditable = false }) => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [showBookConfirm, setShowBookConfirm] = useState(false);
    const [showReserveConfirm, setShowReserveConfirm] = useState(false);

    // CMS State
    const [content, setContent] = useState({});
    const [loading, setLoading] = useState(true);
    const [editingSection, setEditingSection] = useState(null);
    const [editForm, setEditForm] = useState({});

    useEffect(() => {
        fetchContent();
    }, []);

    const fetchContent = async () => {
        try {
            const response = await contentAPI.getAll();
            setContent(response.data);
        } catch (error) {
            console.error("Failed to fetch content", error);
        } finally {
            setLoading(false);
        }
    };

    const handleEditClick = (section, fields) => {
        setEditingSection(section);
        const form = {};
        fields.forEach(field => {
            form[field] = content[field] || '';
        });
        setEditForm(form);
    };

    const handleSave = async () => {
        try {
            const updates = Object.keys(editForm).map(key => ({
                key: key,
                value: editForm[key]
            }));

            await contentAPI.update(updates);
            await fetchContent();
            setEditingSection(null);
            alert("Content updated successfully!");
        } catch (error) {
            console.error("Failed to update content", error);
            alert("Failed to update content.");
        }
    };

    const handleSignUp = () => {
        if (isEditable) {
            alert("Sign Up is disabled in Admin View");
            return;
        }
        navigate('/signup');
    };

    const handleBook = () => {
        if (isEditable) {
            alert("Booking is disabled in Admin View");
            return;
        }
        setShowBookConfirm(true);
    };

    const cancelBook = () => setShowBookConfirm(false);

    const confirmBook = () => {
        setShowBookConfirm(false);
        if (user) {
            navigate('/appointments');
        } else {
            navigate('/login');
        }
    };

    const cancelReserve = () => setShowReserveConfirm(false);
    const confirmReserve = () => setShowReserveConfirm(false);

    // CMS Components
    const EditOverlay = ({ section, fields, style = {} }) => {
        if (!isEditable) return null;
        return (
            <div style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                zIndex: 100,
                ...style
            }}>
                <button
                    onClick={() => handleEditClick(section, fields)}
                    style={{
                        backgroundColor: '#5D4E37',
                        color: 'white',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '20px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                    }}
                >
                    <FaEdit /> Edit {section}
                </button>
            </div>
        );
    };

    const EditModal = () => {
        if (!editingSection) return null;

        return (
            <div style={{
                position: 'fixed',
                top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.5)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 10000
            }}>
                <div style={{
                    backgroundColor: 'white',
                    padding: '30px',
                    borderRadius: '10px',
                    width: '500px',
                    maxWidth: '90%',
                    maxHeight: '90vh',
                    overflowY: 'auto'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                        <h3>Edit {editingSection}</h3>
                        <button onClick={() => setEditingSection(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}><FaTimes /></button>
                    </div>

                    {Object.keys(editForm).map(key => (
                        <div key={key} style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', textTransform: 'capitalize' }}>
                                {key.replace(/_/g, ' ')}
                            </label>
                            {key.includes('image') || key.includes('cover') ? (
                                <input
                                    type="text"
                                    value={editForm[key]}
                                    onChange={(e) => setEditForm({ ...editForm, [key]: e.target.value })}
                                    placeholder="Image URL"
                                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                                />
                            ) : (
                                <textarea
                                    value={editForm[key]}
                                    onChange={(e) => setEditForm({ ...editForm, [key]: e.target.value })}
                                    rows={4}
                                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                                />
                            )}
                        </div>
                    ))}

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                        <button onClick={() => setEditingSection(null)} style={{ padding: '10px 20px', border: '1px solid #ddd', background: 'white', borderRadius: '5px', cursor: 'pointer' }}>Cancel</button>
                        <button onClick={handleSave} style={{ padding: '10px 20px', border: 'none', background: '#5D4E37', color: 'white', borderRadius: '5px', cursor: 'pointer' }}>Save Changes</button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div>
            <EditModal />

            <div style={{ position: 'relative' }}>
                <EditOverlay section="Hero" fields={['hero_headline', 'hero_subheadline', 'hero_cover']} />
                <Hero
                    headline={content.hero_headline}
                    subheadline={content.hero_subheadline}
                    coverImage={content.hero_cover}
                    onSignUpClick={handleSignUp}
                    onBookClick={handleBook}
                />
            </div>

            <AppointmentTypes onBookClick={handleBook} />

            <div style={{ position: 'relative' }}>
                <Features />
            </div>

            <ProductPreview />

            <div style={{ position: 'relative' }}>
                <EditOverlay section="CTA" fields={['cta_text', 'cta_button_text']} />
                <CTAStrip
                    text={content.cta_text}
                    buttonText={content.cta_button_text}
                />
            </div>

            {/* Book Confirmation Modal */}
            {showBookConfirm && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalContent}>
                        <h3 style={styles.modalTitle}>Book Appointment</h3>
                        <p style={styles.modalText}>
                            {user ? "Proceed to booking appointment?" : "You need to sign up or log in first."}
                        </p>
                        <div style={styles.modalActions}>
                            <button onClick={cancelBook} style={styles.cancelBtn}>Cancel</button>
                            <button onClick={confirmBook} style={styles.okBtn}>OK</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reserve Confirmation Modal */}
            {showReserveConfirm && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalContent}>
                        <h3 style={styles.modalTitle}>Reserve Product</h3>
                        <p style={styles.modalText}>You need to sign up first.</p>
                        <div style={styles.modalActions}>
                            <button onClick={cancelReserve} style={styles.cancelBtn}>Cancel</button>
                            <button onClick={confirmReserve} style={styles.okBtn}>OK</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const styles = {
    servicesSection: {
        padding: '60px 0',
        backgroundColor: 'var(--color-white)',
    },
    container: {
        maxWidth: 'var(--max-width)',
        margin: '0 auto',
        padding: '0 20px',
    },
    sectionTitle: {
        fontFamily: 'var(--font-heading-montserrat)',
        fontSize: '2rem',
        color: 'var(--color-dark-brown)',
        marginBottom: '30px',
        textAlign: 'center',
    },
    servicesGrid: {
        backgroundColor: 'var(--color-cream-white)',
        padding: '30px',
        borderRadius: 'var(--border-radius)',
        maxWidth: '800px',
        margin: '0 auto',
        boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
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
    modalOverlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    modalContent: {
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '10px',
        textAlign: 'center',
        maxWidth: '400px',
        width: '90%',
        boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
    },
    modalTitle: {
        fontFamily: 'var(--font-heading-montserrat)',
        fontSize: '1.5rem',
        color: 'var(--color-dark-brown)',
        marginBottom: '15px',
    },
    modalText: {
        fontFamily: 'var(--font-body-inter)',
        fontSize: '1rem',
        color: '#666',
        marginBottom: '25px',
    },
    modalActions: {
        display: 'flex',
        justifyContent: 'center',
        gap: '15px',
    },
    cancelBtn: {
        padding: '10px 20px',
        border: '1px solid #ccc',
        borderRadius: '5px',
        backgroundColor: 'white',
        cursor: 'pointer',
        fontFamily: 'var(--font-body-inter)',
    },
    okBtn: {
        padding: '10px 20px',
        border: 'none',
        borderRadius: '5px',
        backgroundColor: 'var(--color-dark-brown)',
        color: 'white',
        cursor: 'pointer',
        fontFamily: 'var(--font-body-inter)',
    },
};

export default Home;
