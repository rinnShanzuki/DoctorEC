import React, { useRef } from 'react';
import { useSiteSettings } from '../context/SiteSettingsContext';

const ChristmasPromo = ({ onBookNow }) => {
    const { settings, isEditing, updateSetting, uploadImage } = useSiteSettings();
    const fileInputRef = useRef(null);

    const isVisible = settings.promo_visible !== 'false'; // Default to true
    const promoImage = settings.promo_image;

    const handleRemove = () => {
        updateSetting('promo_visible', 'false');
    };

    const handleAdd = () => {
        updateSetting('promo_visible', 'true');
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (file) {
            try {
                await uploadImage(file, 'promo_image');
            } catch (error) {
                alert('Failed to upload image');
            }
        }
    };

    if (!isVisible && !isEditing) return null;

    return (
        <div style={{ position: 'relative' }}>
            {isVisible ? (
                <section style={{
                    ...styles.promoSection,
                    backgroundImage: promoImage ? `url(${promoImage})` : styles.promoSection.background,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                }}>
                    {!promoImage && <div style={styles.overlay}></div>}

                    <div className="container" style={styles.container}>
                        {!promoImage ? (
                            <>
                                <div style={styles.label}>Upcoming Promo Event</div>
                                <div style={styles.date}>Dec 1 at 12 AM - Dec 15 at 12 AM</div>

                                <h1 style={styles.title}>DOCTOR EC CHRISTMAS PROMO</h1>
                                <h2 style={styles.subtitle}>ARE YOU READYYYY?</h2>

                                <p style={styles.body}>
                                    Christmas clarity is coming… watch out for our. See the holiday season brighter and clearer this year!
                                </p>

                                <div style={styles.saleInfo}>
                                    SALE From DECEMBER 1 to 15, 2025!!!
                                </div>

                                <div style={styles.offersContainer}>
                                    <ul style={styles.offersList}>
                                        <li style={styles.offerItem}>FREE COMPUTERIZED EYE CHECK UP</li>
                                        <li style={styles.offerItem}>500 pesos complete set of eyeglasses</li>
                                        <li style={styles.offerItem}>Up to 30% discount for Quality Frames and Special Lenses / Photochromic Lenses</li>
                                    </ul>
                                </div>
                            </>
                        ) : (
                            <div style={{ height: '400px' }}></div> // Spacer for background image
                        )}
                    </div>

                    {!promoImage && onBookNow && (
                        <div style={styles.ctaContainer}>
                            <div style={styles.ctaText}>Book now and don't lose the chance!</div>
                            <button style={styles.bookBtn} onClick={onBookNow}>
                                BOOK NOW 🎄
                            </button>
                        </div>
                    )}

                    {/* Simple CSS Snow Effect */}
                    <div className="snowflakes" aria-hidden="true">
                        <div className="snowflake">❅</div>
                        <div className="snowflake">❆</div>
                        <div className="snowflake">❅</div>
                        <div className="snowflake">❆</div>
                        <div className="snowflake">❅</div>
                        <div className="snowflake">❆</div>
                        <div className="snowflake">❅</div>
                        <div className="snowflake">❆</div>
                        <div className="snowflake">❅</div>
                        <div className="snowflake">❆</div>
                    </div>
                </section>
            ) : (
                <div style={{ padding: '20px', textAlign: 'center', backgroundColor: '#f0f0f0', border: '2px dashed #ccc' }}>
                    <p style={{ color: '#888' }}>Christmas Promo Hidden</p>
                </div>
            )}

            {isEditing && (
                <div style={{
                    position: 'absolute',
                    bottom: '10px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 1000,
                    display: 'flex',
                    gap: '10px',
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    padding: '10px',
                    borderRadius: '8px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
                }}>
                    {isVisible ? (
                        <>
                            <button
                                onClick={handleRemove}
                                style={{ ...styles.editBtn, backgroundColor: '#D32F2F' }}
                            >
                                Remove Section
                            </button>
                            <button
                                onClick={() => fileInputRef.current.click()}
                                style={{ ...styles.editBtn, backgroundColor: '#1976D2' }}
                            >
                                Change Image
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={handleAdd}
                            style={{ ...styles.editBtn, backgroundColor: '#388E3C' }}
                        >
                            Add Section
                        </button>
                    )}
                    <input
                        type="file"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        accept="image/*"
                        onChange={handleImageUpload}
                    />
                </div>
            )}
        </div>
    );
};

// Add editBtn style to styles object
const styles = {
    // ... existing styles ...
    editBtn: {
        padding: '8px 16px',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontWeight: 'bold',
        fontSize: '14px',
    },
    promoSection: {
        background: 'linear-gradient(135deg, #c62828 0%, #2e7d32 100%)', // Red to Green gradient
        padding: '80px 0',
        color: '#fff',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
    },
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: 'radial-gradient(circle, transparent 20%, #000 150%)', // Vignette
        opacity: 0.3,
        zIndex: 1,
    },
    container: {
        position: 'relative',
        zIndex: 2,
        maxWidth: '800px',
        margin: '0 auto',
        border: '2px solid #FFD700', // Gold border
        borderRadius: '15px',
        padding: '40px',
        backgroundColor: 'rgba(0, 0, 0, 0.2)', // Semi-transparent dark bg
        backdropFilter: 'blur(5px)',
    },
    label: {
        backgroundColor: '#FFD700', // Gold
        color: '#8B0000', // Dark Red
        display: 'inline-block',
        padding: '5px 15px',
        borderRadius: '20px',
        fontWeight: 'bold',
        fontSize: '0.9rem',
        marginBottom: '15px',
        textTransform: 'uppercase',
        letterSpacing: '1px',
    },
    date: {
        fontFamily: 'var(--font-body-inter)',
        fontSize: '1.1rem',
        marginBottom: '20px',
        fontWeight: '500',
        color: '#FFECB3', // Light Gold
    },
    title: {
        fontFamily: 'var(--font-heading-poppins)',
        fontSize: '2.5rem',
        fontWeight: '700',
        marginBottom: '10px',
        textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
        color: '#FFF',
    },
    subtitle: {
        fontFamily: 'var(--font-heading-montserrat)',
        fontSize: '1.8rem',
        fontWeight: '600',
        marginBottom: '20px',
        color: '#FFD700', // Gold
        textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
    },
    body: {
        fontFamily: 'var(--font-body-inter)',
        fontSize: '1.1rem',
        lineHeight: '1.6',
        marginBottom: '30px',
        maxWidth: '600px',
        marginLeft: 'auto',
        marginRight: 'auto',
    },
    saleInfo: {
        fontSize: '1.3rem',
        fontWeight: 'bold',
        color: '#FFD700',
        marginBottom: '30px',
        borderTop: '1px solid rgba(255,255,255,0.3)',
        borderBottom: '1px solid rgba(255,255,255,0.3)',
        padding: '10px 0',
        display: 'inline-block',
    },
    offersContainer: {
        textAlign: 'left',
        maxWidth: '600px',
        margin: '0 auto',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        padding: '20px',
        borderRadius: '10px',
        marginBottom: '30px',
    },
    offersList: {
        listStyleType: 'none',
        padding: 0,
        margin: 0,
    },
    offerItem: {
        fontSize: '1.1rem',
        marginBottom: '10px',
        paddingLeft: '25px',
        position: 'relative',
    },
    ctaContainer: {
        marginTop: '20px',
    },
    ctaText: {
        fontSize: '1.2rem',
        fontWeight: 'bold',
        color: '#FFD700',
        marginBottom: '15px',
        textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
    },
    bookBtn: {
        backgroundColor: '#D32F2F', // Christmas Red
        color: '#FFF', // White text
        border: '2px solid #FFD700', // Gold border
        padding: '15px 40px',
        fontSize: '1.1rem',
        fontWeight: '700',
        borderRadius: '30px',
        cursor: 'pointer',
        boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
        transition: 'transform 0.2s, box-shadow 0.2s, background-color 0.2s',
        textTransform: 'uppercase',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '10px',
    },
};

// Inject styles for snowflakes and list bullets
const styleSheet = document.createElement("style");
styleSheet.innerText = `
    .offerItem::before {
        content: '🎁';
        position: absolute;
        left: 0;
        top: 2px;
    }
    .bookBtn:hover {
        transform: scale(1.05);
        box-shadow: 0 6px 15px rgba(0,0,0,0.4);
        background-color: #FFECB3;
    }
    
    /* Snowflake Animation */
    .snowflake {
        color: #fff;
        font-size: 1em;
        font-family: Arial;
        text-shadow: 0 0 1px #000;
        position: absolute;
        top: -10%;
        z-index: 9999;
        user-select: none;
        cursor: default;
        animation-name: snowflakes-fall, snowflakes-shake;
        animation-duration: 10s, 3s;
        animation-timing-function: linear, ease-in-out;
        animation-iteration-count: infinite, infinite;
        animation-play-state: running, running;
    }
    .snowflake:nth-of-type(0) { left: 1%; animation-delay: 0s, 0s; }
    .snowflake:nth-of-type(1) { left: 10%; animation-delay: 1s, 1s; }
    .snowflake:nth-of-type(2) { left: 20%; animation-delay: 6s, .5s; }
    .snowflake:nth-of-type(3) { left: 30%; animation-delay: 4s, 2s; }
    .snowflake:nth-of-type(4) { left: 40%; animation-delay: 2s, 2s; }
    .snowflake:nth-of-type(5) { left: 50%; animation-delay: 8s, 3s; }
    .snowflake:nth-of-type(6) { left: 60%; animation-delay: 6s, 2s; }
    .snowflake:nth-of-type(7) { left: 70%; animation-delay: 2.5s, 1s; }
    .snowflake:nth-of-type(8) { left: 80%; animation-delay: 1s, 0s; }
    .snowflake:nth-of-type(9) { left: 90%; animation-delay: 3s, 1.5s; }
    
    @keyframes snowflakes-fall {
        0% { top: -10%; }
        100% { top: 100%; }
    }
    @keyframes snowflakes-shake {
        0% { transform: translateX(0px); }
        50% { transform: translateX(80px); }
        100% { transform: translateX(0px); }
    }
`;
document.head.appendChild(styleSheet);

export default ChristmasPromo;
