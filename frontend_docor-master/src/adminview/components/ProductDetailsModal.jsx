import React from 'react';
import { FaTimes } from 'react-icons/fa';
import logo from '../../assets/logo.jpg';

const ProductDetailsModal = ({ isOpen, onClose, product, onReserve }) => {
    if (!isOpen || !product) return null;

    return (
        <div style={styles.overlay} onClick={onClose}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
                <button style={styles.closeBtn} onClick={onClose}>
                    <FaTimes />
                </button>
                <div style={styles.content}>
                    <div style={styles.header}>
                        <img src={logo} alt="Doctor EC Optical Clinic" style={styles.logo} />
                        <h3 style={styles.clinicName}>Doctor EC Optical Clinic</h3>
                    </div>
                    <div style={styles.body}>
                        <div style={styles.imageSection}>
                            <img src={product.image} alt={product.name} style={styles.image} />
                        </div>
                        <div style={styles.detailsSection}>
                            <h2 style={styles.name}>{product.name}</h2>
                            <p style={styles.price}>{product.price.toLocaleString()}</p>

                            <div style={styles.attributes}>
                                <p><strong>Category:</strong> {product.target_audience || product.category}</p>
                                {product.shape && <p><strong>Shape:</strong> {product.shape}</p>}
                                {product.frame_color && <p><strong>Color:</strong> {product.frame_color}</p>}
                                {product.features && <p><strong>Features:</strong> {product.features}</p>}
                                {product.grade_info && <p><strong>Grade Info:</strong> {product.grade_info}</p>}
                            </div>

                            <p style={styles.description}>
                                {product.description || "Experience clarity and style with our premium eyewear. Designed for comfort and durability, perfect for your daily needs."}
                            </p>

                            <div style={styles.customizeSection}>
                                <label style={styles.label}>Customize Grade (Optional):</label>
                                <input
                                    type="text"
                                    placeholder="Enter your grade (e.g., OD: -1.00, OS: -1.25)"
                                    style={styles.input}
                                />
                            </div>

                            <div style={styles.actions}>
                                {onReserve ? (
                                    <button style={styles.reserveBtn} onClick={onReserve}>Reserve Now</button>
                                ) : (
                                    <button style={styles.reserveBtn} disabled>Available In-Store</button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const styles = {
    overlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1100,
        backdropFilter: 'blur(5px)',
    },
    modal: {
        backgroundColor: '#FFFDFB',
        borderRadius: '15px',
        width: '90%',
        maxWidth: '700px', // More compact
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        animation: 'fadeIn 0.3s ease-out',
        display: 'flex',
        flexDirection: 'column',
    },
    closeBtn: {
        position: 'absolute',
        top: '15px',
        right: '15px',
        background: 'rgba(0,0,0,0.05)',
        border: 'none',
        borderRadius: '50%',
        width: '35px',
        height: '35px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        fontSize: '1rem',
        color: '#5D4037',
        zIndex: 10,
        transition: 'all 0.2s',
    },
    content: {
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
    },
    header: {
        display: 'flex',
        alignItems: 'center',
        gap: '15px',
        marginBottom: '20px',
        borderBottom: '1px solid #eee',
        paddingBottom: '15px',
    },
    logo: {
        width: '50px',
        height: '50px',
        borderRadius: '50%',
        objectFit: 'cover',
    },
    clinicName: {
        fontFamily: 'var(--font-heading-poppins)',
        fontSize: '1.2rem',
        color: '#3E2723',
        margin: 0,
    },
    body: {
        display: 'flex',
        flexDirection: 'row',
        gap: '30px',
    },
    imageSection: {
        flex: '1',
        backgroundColor: '#F5F5F5',
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        maxHeight: '300px', // Limit image height
    },
    image: {
        maxWidth: '100%',
        maxHeight: '100%',
        objectFit: 'contain',
        filter: 'drop-shadow(0 5px 15px rgba(0,0,0,0.1))',
    },
    detailsSection: {
        flex: '1',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
    },
    name: {
        fontFamily: 'var(--font-heading-poppins)',
        fontSize: '1.5rem',
        color: '#3E2723',
        marginBottom: '5px',
    },
    price: {
        fontFamily: 'var(--font-body-inter)',
        fontSize: '1.2rem',
        color: '#8D6E63',
        fontWeight: '600',
        marginBottom: '15px',
    },
    description: {
        fontFamily: 'var(--font-body-inter)',
        fontSize: '0.9rem',
        color: '#5D4037',
        lineHeight: '1.5',
        marginBottom: '25px',
        opacity: 0.8,
    },
    actions: {
        marginTop: 'auto',
    },
    reserveBtn: {
        backgroundColor: '#3E2723',
        color: 'white',
        border: 'none',
        padding: '12px 24px',
        borderRadius: '8px',
        fontSize: '0.9rem',
        fontWeight: '600',
        cursor: 'pointer',
        width: '100%',
        transition: 'background-color 0.2s',
    },
    attributes: {
        marginBottom: '15px',
        fontSize: '0.9rem',
        color: '#5D4037',
        display: 'flex',
        flexDirection: 'column',
        gap: '5px',
    },
    customizeSection: {
        marginBottom: '20px',
    },
    label: {
        display: 'block',
        fontFamily: 'var(--font-body-inter)',
        fontSize: '0.9rem',
        color: '#3E2723',
        marginBottom: '5px',
        fontWeight: '500',
    },
    input: {
        width: '100%',
        padding: '10px',
        borderRadius: '8px',
        border: '1px solid #ddd',
        fontFamily: 'var(--font-body-inter)',
        fontSize: '0.9rem',
    },
};

// Add animation style
const styleSheet = document.createElement("style");
styleSheet.innerText = `
    @keyframes fadeIn {
        from { opacity: 0; transform: scale(0.95); }
        to { opacity: 1; transform: scale(1); }
    }
    @media (max-width: 768px) {
        .body { flex-direction: column !important; }
        .imageSection { height: 250px; }
    }
`;
document.head.appendChild(styleSheet);

export default ProductDetailsModal;
