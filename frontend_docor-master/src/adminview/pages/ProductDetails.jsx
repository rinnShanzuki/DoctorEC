import React from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useShop } from '../../context/ShopContext';

const ProductDetails = () => {
    const { id } = useParams();
    const { products, addReservation } = useShop();
    const product = products.find((p) => p.id === parseInt(id));

    if (!product) {
        return (
            <div>
                <div style={styles.notFound}>
                    <h2>Product not found</h2>
                    <Link to="/products" style={styles.backLink}>Back to Products</Link>
                </div>
            </div>
        );
    }

    const handleReserve = () => {
        addReservation(product);
        alert(`${product.name} has been reserved for you!`);
    };

    return (
        <div>
            <div className="container" style={styles.container}>
                <div style={styles.grid}>
                    <div style={styles.imageSection}>
                        <img src={product.image} alt={product.name} style={styles.image} />
                    </div>
                    <div style={styles.infoSection}>
                        <h1 style={styles.title}>{product.name}</h1>
                        <p style={styles.price}>${product.price}</p>
                        <p style={styles.description}>{product.description}</p>

                        <div style={styles.specs}>
                            <h3 style={styles.specTitle}>Specifications</h3>
                            <ul style={styles.specList}>
                                <li>Category: {product.category}</li>
                                <li>Material: Premium Acetate</li>
                                <li>Warranty: 1 Year</li>
                                <li>Availability: In Stock</li>
                            </ul>
                        </div>

                        <button onClick={handleReserve} style={styles.reserveBtn}>Reserve Now</button>
                        <p style={styles.note}>
                            * Reserving this item holds it at the clinic for 48 hours. No payment required online.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const styles = {
    container: {
        maxWidth: 'var(--max-width)',
        margin: '60px auto',
        padding: '0 20px',
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '60px',
        alignItems: 'start',
    },
    imageSection: {
        backgroundColor: 'var(--color-white)',
        padding: '40px',
        border: '1px solid #E0E0E0',
        borderRadius: 'var(--border-radius)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
    },
    image: {
        maxWidth: '100%',
        height: 'auto',
    },
    infoSection: {
        paddingTop: '20px',
    },
    title: {
        fontFamily: 'var(--font-heading-poppins)',
        fontSize: '2.5rem',
        color: 'var(--color-dark-brown)',
        marginBottom: '10px',
    },
    price: {
        fontFamily: 'var(--font-body-inter)',
        fontSize: '1.5rem',
        color: 'var(--color-text-primary)',
        fontWeight: '600',
        marginBottom: '20px',
    },
    description: {
        fontFamily: 'var(--font-body-inter)',
        fontSize: '1rem',
        color: 'var(--color-text-secondary)',
        lineHeight: '1.6',
        marginBottom: '30px',
    },
    specs: {
        marginBottom: '30px',
    },
    specTitle: {
        fontFamily: 'var(--font-heading-montserrat)',
        fontSize: '1.1rem',
        color: 'var(--color-dark-brown)',
        marginBottom: '10px',
    },
    specList: {
        listStyle: 'disc',
        paddingLeft: '20px',
        fontFamily: 'var(--font-body-inter)',
        color: 'var(--color-text-secondary)',
        lineHeight: '1.8',
    },
    reserveBtn: {
        backgroundColor: 'var(--color-dark-brown)',
        color: 'var(--color-white)',
        padding: '16px 40px',
        fontSize: '1.1rem',
        fontWeight: '600',
        border: 'none',
        borderRadius: 'var(--border-radius)',
        width: '100%',
        marginBottom: '15px',
    },
    note: {
        fontFamily: 'var(--font-body-inter)',
        fontSize: '0.85rem',
        color: '#795548',
        fontStyle: 'italic',
    },
    notFound: {
        textAlign: 'center',
        padding: '100px 0',
    },
    backLink: {
        color: 'var(--color-dark-brown)',
        textDecoration: 'underline',
    },
};

export default ProductDetails;
