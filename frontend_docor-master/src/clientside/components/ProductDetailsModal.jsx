import React from 'react';
import { FaTimes } from 'react-icons/fa';
import logo from '../../assets/logo.jpg';

const ProductDetailsModal = ({ isOpen, onClose, product, detailsConfig = {} }) => {
    if (!isOpen || !product) return null;

    const isVisible = (field) => {
        if (detailsConfig[field] !== undefined) return detailsConfig[field];
        if (field === 'price') return false;
        return true;
    };

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
                    <div className="product-modal-body" style={styles.body}>
                        <div className="product-modal-image" style={styles.imageSection}>
                            <img src={product.image} alt={product.name} style={styles.image} />
                        </div>
                        <div style={styles.detailsSection}>
                            {isVisible('name') && <h2 style={styles.name}>{product.name}</h2>}
                            {isVisible('price') && <p style={styles.price}>{product.price.toLocaleString()}</p>}

                            <div style={styles.attributes}>
                                {isVisible('category') && (product.target_audience || product.category) && <p><strong>Category:</strong> {product.target_audience || product.category}</p>}
                                {isVisible('brand') && product.brand && <p><strong>Brand:</strong> {product.brand}</p>}
                                {isVisible('sex') && product.sex && <p><strong>Sex:</strong> {product.sex}</p>}
                                {isVisible('age') && product.age && <p><strong>Age:</strong> {product.age}</p>}
                                {isVisible('frame_shape') && product.shape && <p><strong>Shape:</strong> {product.shape}</p>}
                                {isVisible('frame_color') && product.frame_color && <p><strong>Color:</strong> {product.frame_color}</p>}
                                {isVisible('tint') && product.tint && <p><strong>Tint:</strong> {product.tint}</p>}
                                {isVisible('feature') && product.features && <p><strong>Features:</strong> {product.features}</p>}
                                {isVisible('grade') && product.grade_info && <p><strong>Grade Info:</strong> {product.grade_info}</p>}
                            </div>

                            {isVisible('description') && (
                                <p style={styles.description}>
                                    {product.description || "Experience clarity and style with our premium eyewear. Designed for comfort and durability, perfect for your daily needs."}
                                </p>
                            )}

                            <div style={styles.customizeSection}>
                                <label style={styles.label}>Customize Grade (Optional):</label>
                                <input
                                    type="text"
                                    placeholder="Enter your grade (e.g., OD: -1.00, OS: -1.25)"
                                    style={styles.input}
                                />
                            </div>

                            <div style={styles.actions}>
                                <button style={styles.reserveBtn} disabled>Available In-Store</button>
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
        maxWidth: '700px',
        maxHeight: '90vh',
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
        overflowY: 'auto',
        flex: 1,
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
        flex: '0 0 auto',
        backgroundColor: '#F5F5F5',
        borderRadius: '10px',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '10px',
    },
    image: {
        width: '100%',
        maxHeight: '350px',
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
        .product-modal-body { flex-direction: column !important; }
        .product-modal-image { max-height: 250px !important; }
    }
`;
document.head.appendChild(styleSheet);

export default ProductDetailsModal;
