import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import ProductDetailsModal from './ProductDetailsModal';
import { useSiteSettings } from '../context/SiteSettingsContext';
import api from '../../services/api';

const DEFAULT_CONFIG = {
    title: 'Eyewear You Can Trust',
    display_mode: 'grid', // 'grid' or 'carousel'
    max_products: 6,
};

const ProductPreview = () => {
    const [products, setProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [carouselIdx, setCarouselIdx] = useState(0);
    const { getSetting } = useSiteSettings();

    const raw = getSetting('product_preview_settings', DEFAULT_CONFIG);
    const config = { ...DEFAULT_CONFIG, ...(typeof raw === 'string' ? JSON.parse(raw) : raw) };

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const res = await api.get('/products');
            const data = res.data?.data || res.data || [];
            setProducts(data.slice(0, config.max_products || 6));
        } catch (e) {
            console.error('Failed to fetch products for preview:', e);
        }
    };

    const handleViewDetails = (product) => {
        setSelectedProduct(product);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedProduct(null);
    };

    // Carousel navigation
    const itemsPerSlide = 3;
    const maxSlide = Math.max(0, products.length - itemsPerSlide);
    const nextSlide = () => setCarouselIdx(prev => Math.min(prev + 1, maxSlide));
    const prevSlide = () => setCarouselIdx(prev => Math.max(prev - 1, 0));

    if (products.length === 0) return null;

    return (
        <section style={styles.section}>
            <div className="container" style={styles.container}>
                <h2 style={styles.title}>{config.title}</h2>

                {config.display_mode === 'carousel' ? (
                    /* Carousel Mode */
                    <div style={styles.carouselWrapper}>
                        <button onClick={prevSlide} disabled={carouselIdx === 0}
                            style={{ ...styles.carouselArrow, opacity: carouselIdx === 0 ? 0.3 : 1 }}>
                            <FaChevronLeft />
                        </button>
                        <div style={styles.carouselTrack}>
                            <div style={{
                                display: 'flex', gap: '20px',
                                transform: `translateX(-${carouselIdx * (100 / itemsPerSlide + 2)}%)`,
                                transition: 'transform 0.4s ease',
                            }}>
                                {products.map((product) => (
                                    <div key={product.id} style={styles.carouselCard} className="product-card">
                                        <div style={styles.imageWrapper} className="image-wrapper">
                                            <img src={product.image} alt={product.name} style={styles.image} />
                                            <div className="overlay">
                                                <button style={styles.viewBtn} onClick={() => handleViewDetails(product)}>
                                                    View Details
                                                </button>
                                            </div>
                                        </div>
                                        <p style={styles.productName}>{product.name}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <button onClick={nextSlide} disabled={carouselIdx >= maxSlide}
                            style={{ ...styles.carouselArrow, opacity: carouselIdx >= maxSlide ? 0.3 : 1 }}>
                            <FaChevronRight />
                        </button>
                    </div>
                ) : (
                    /* Grid Mode (default) */
                    <div style={styles.grid}>
                        {products.map((product) => (
                            <div key={product.id} style={styles.card} className="product-card">
                                <div style={styles.imageWrapper} className="image-wrapper">
                                    <img src={product.image} alt={product.name} style={styles.image} />
                                    <div className="overlay">
                                        <button style={styles.viewBtn} onClick={() => handleViewDetails(product)}>
                                            View Details
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div style={styles.footer}>
                    <Link to="/products" style={styles.viewAllBtn}>View All Products</Link>
                </div>

                <ProductDetailsModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    product={selectedProduct}
                />
            </div>
        </section>
    );
};

const styles = {
    section: { backgroundColor: 'var(--color-cream-white)', padding: '80px 0' },
    container: { maxWidth: 'var(--max-width)', margin: '0 auto', padding: '0 20px', textAlign: 'center' },
    title: { fontFamily: 'var(--font-heading-poppins)', fontSize: '2.5rem', color: 'var(--color-dark-brown)', marginBottom: '50px' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' },
    card: { padding: '0', textAlign: 'center', position: 'relative', overflow: 'hidden', cursor: 'pointer' },
    carouselWrapper: { display: 'flex', alignItems: 'center', gap: '10px' },
    carouselTrack: { flex: 1, overflow: 'hidden' },
    carouselCard: { minWidth: 'calc(33.333% - 14px)', flexShrink: 0, cursor: 'pointer' },
    carouselArrow: {
        background: 'none', border: '2px solid var(--color-dark-brown)', borderRadius: '50%',
        width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', color: 'var(--color-dark-brown)', fontSize: '1rem', flexShrink: 0,
    },
    productName: { fontFamily: 'var(--font-body-inter)', fontSize: '0.9rem', color: 'var(--color-dark-brown)', marginTop: '8px', fontWeight: '500' },
    imageWrapper: {
        width: '100%', paddingTop: '100%', position: 'relative', overflow: 'hidden', borderRadius: 'var(--border-radius)',
    },
    image: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' },
    viewBtn: {
        backgroundColor: 'var(--color-white)', color: 'var(--color-dark-brown)',
        padding: '12px 24px', fontSize: '0.9rem', fontWeight: '600',
        border: 'none', borderRadius: '30px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        cursor: 'pointer', transition: 'transform 0.2s ease',
    },
    footer: { marginTop: '60px' },
    viewAllBtn: {
        display: 'inline-block', backgroundColor: 'var(--color-dark-brown)', color: 'var(--color-white)',
        padding: '16px 40px', fontSize: '1rem', fontWeight: '600', textDecoration: 'none',
        borderRadius: 'var(--border-radius)', transition: 'all 0.3s ease', boxShadow: '0 4px 10px rgba(62, 39, 35, 0.2)',
    },
};

// Inject hover styles
const styleSheet = document.createElement("style");
styleSheet.innerText = `
    .image-wrapper:hover img { transform: scale(1.1); }
    .image-wrapper:hover .overlay { opacity: 1; }
    .overlay {
        position: absolute; top: 0; left: 0; width: 100%; height: 100%;
        background-color: rgba(62, 39, 35, 0.4);
        display: flex; align-items: center; justify-content: center;
        opacity: 0; transition: opacity 0.3s ease;
    }
`;
document.head.appendChild(styleSheet);

export default ProductPreview;
