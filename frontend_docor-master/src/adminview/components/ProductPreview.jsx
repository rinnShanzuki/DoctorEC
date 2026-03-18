import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import ProductDetailsModal from './ProductDetailsModal'; // Import Modal

import glass1 from '../../assets/glasses/glass1.jpg';
import glass2 from '../../assets/glasses/glass2.jpg';
import glass3 from '../../assets/glasses/glass3.jpg';
import glass4 from '../../assets/glasses/glass4.jpg';
import glass5 from '../../assets/glasses/glass5.jpg';
import glass6 from '../../assets/glasses/glass6.jpg';

const ProductPreview = ({ onReserveClick }) => {
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const products = [
        { id: 1, name: 'Classic Tortoise', price: '₱1,200', image: glass1 },
        { id: 2, name: 'Modern Black Rim', price: '₱1,450', image: glass2 },
        { id: 3, name: 'Gold Aviator', price: '₱1,600', image: glass3 },
        { id: 4, name: 'Crystal Clear', price: '₱1,100', image: glass4 },
        { id: 5, name: 'Blue Light Blocker', price: '₱950', image: glass5 },
        { id: 6, name: 'Vintage Round', price: '₱1,350', image: glass6 },
    ];

    const handleViewDetails = (product) => {
        setSelectedProduct(product);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedProduct(null);
    };

    const handleReserveFromModal = () => {
        handleCloseModal();
        if (window.confirm("You need to sign up first. Proceed to Sign Up?")) {
            onReserveClick(); // Trigger sign up modal from parent
        }
    };

    return (
        <section style={styles.section}>
            <div className="container" style={styles.container}>
                <h2 style={styles.title}>Eyewear You Can Trust</h2>
                <div style={styles.grid}>
                    {products.map((product) => (
                        <div key={product.id} style={styles.card} className="product-card">
                            <div style={styles.imageWrapper} className="image-wrapper">
                                <img src={product.image} alt={product.name} style={styles.image} />
                                <div className="overlay">
                                    <button
                                        style={styles.viewBtn}
                                        onClick={() => handleViewDetails(product)}
                                    >
                                        View Details
                                    </button>
                                </div>
                            </div>
                            {/* Name and Price removed from here, shown in modal */}
                        </div>
                    ))}
                </div>

                <div style={styles.footer}>
                    <Link to="/products" style={styles.viewAllBtn}>View All Products</Link>
                </div>

                <ProductDetailsModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    product={selectedProduct}
                    onReserve={handleReserveFromModal}
                />
            </div>
        </section>
    );
};

const styles = {
    section: {
        backgroundColor: 'var(--color-cream-white)',
        padding: '80px 0',
    },
    container: {
        maxWidth: 'var(--max-width)',
        margin: '0 auto',
        padding: '0 20px',
        textAlign: 'center',
    },
    title: {
        fontFamily: 'var(--font-heading-poppins)',
        fontSize: '2.5rem',
        color: 'var(--color-dark-brown)',
        marginBottom: '50px',
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '20px', // Reduced gap
    },
    card: {
        // Removed background and border
        padding: '0',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'pointer',
    },
    imageWrapper: {
        width: '100%',
        paddingTop: '100%', // 1:1 Aspect Ratio (Square)
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 'var(--border-radius)',
    },
    image: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover', // Crop to cover
        transition: 'transform 0.5s ease',
    },
    viewBtn: {
        backgroundColor: 'var(--color-white)',
        color: 'var(--color-dark-brown)',
        padding: '12px 24px',
        fontSize: '0.9rem',
        fontWeight: '600',
        border: 'none',
        borderRadius: '30px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        cursor: 'pointer',
        transition: 'transform 0.2s ease',
    },
    footer: {
        marginTop: '60px',
    },
    viewAllBtn: {
        display: 'inline-block',
        backgroundColor: 'var(--color-dark-brown)',
        color: 'var(--color-white)',
        padding: '16px 40px',
        fontSize: '1rem',
        fontWeight: '600',
        textDecoration: 'none',
        borderRadius: 'var(--border-radius)',
        transition: 'all 0.3s ease',
        boxShadow: '0 4px 10px rgba(62, 39, 35, 0.2)',
    }
};

// Inject hover styles
const styleSheet = document.createElement("style");
styleSheet.innerText = `
    .image-wrapper:hover .image {
        transform: scale(1.1);
    }
    .image-wrapper:hover .overlay {
        opacity: 1;
    }
    .overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(62, 39, 35, 0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: opacity 0.3s ease;
    }
    .viewBtn:hover {
        transform: scale(1.05);
    }
    .viewAllBtn:hover {
        background-color: #3E2723;
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(62, 39, 35, 0.3);
    }
`;
document.head.appendChild(styleSheet);

export default ProductPreview;
