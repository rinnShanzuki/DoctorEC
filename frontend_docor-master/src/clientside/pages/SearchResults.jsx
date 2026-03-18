import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import axios from 'axios';
import api from '../../config/api.config';

const SearchResults = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q') || '';

    const [loading, setLoading] = useState(true);
    const [products, setProducts] = useState([]);
    const [services, setServices] = useState([]);

    useEffect(() => {
        if (query) {
            searchAll();
        }
    }, [query]);

    const searchAll = async () => {
        try {
            setLoading(true);

            // Search products and services
            const [productsRes, servicesRes] = await Promise.all([
                axios.get(`${api.BASE_URL}/products`),
                axios.get(`${api.BASE_URL}/services`)
            ]);

            const allProducts = productsRes.data.data || productsRes.data || [];
            const allServices = servicesRes.data.data || servicesRes.data || [];

            // Filter by search query
            const searchLower = query.toLowerCase();
            const filteredProducts = allProducts.filter(product =>
                product.name?.toLowerCase().includes(searchLower) ||
                product.description?.toLowerCase().includes(searchLower)
            );
            const filteredServices = allServices.filter(service =>
                service.name?.toLowerCase().includes(searchLower) ||
                service.description?.toLowerCase().includes(searchLower)
            );

            setProducts(filteredProducts);
            setServices(filteredServices);
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setLoading(false);
        }
    };

    const totalResults = products.length + services.length;

    return (
        <div>
            <Navbar />

            <div style={styles.container}>
                <div style={styles.header}>
                    <h1 style={styles.title}>Search Results</h1>
                    <p style={styles.query}>Showing results for: <strong>"{query}"</strong></p>
                    <p style={styles.count}>{totalResults} result{totalResults !== 1 ? 's' : ''} found</p>
                </div>

                {loading ? (
                    <div style={styles.loading}>Searching...</div>
                ) : (
                    <>
                        {/* Services Results */}
                        {services.length > 0 && (
                            <div style={styles.section}>
                                <h2 style={styles.sectionTitle}>Services ({services.length})</h2>
                                <div style={styles.grid}>
                                    {services.map((service) => (
                                        <div
                                            key={service.service_id || service.id}
                                            style={styles.card}
                                            onClick={() => navigate(user ? '/client-services' : '/services')}
                                        >
                                            <div style={styles.icon}>🏥</div>
                                            <h3 style={styles.cardTitle}>{service.name}</h3>
                                            <p style={styles.cardDescription}>{service.description}</p>
                                            <p style={styles.price}>₱{parseFloat(service.price || 0).toFixed(2)}</p>
                                            <button style={styles.viewButton}>View Service</button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Products Results */}
                        {products.length > 0 && (
                            <div style={styles.section}>
                                <h2 style={styles.sectionTitle}>Products ({products.length})</h2>
                                <div style={styles.grid}>
                                    {products.map((product) => (
                                        <div
                                            key={product.product_id || product.id}
                                            style={styles.card}
                                            onClick={() => navigate(`/client-products/${product.product_id || product.id}`)}
                                        >
                                            {product.image && (
                                                <img
                                                    src={product.image}
                                                    alt={product.name}
                                                    style={styles.productImage}
                                                />
                                            )}
                                            <h3 style={styles.cardTitle}>{product.name}</h3>
                                            <p style={styles.cardDescription}>{product.description}</p>
                                            <p style={styles.price}>₱{parseFloat(product.price || 0).toFixed(2)}</p>
                                            <button style={styles.viewButton}>View Product</button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* No Results */}
                        {totalResults === 0 && (
                            <div style={styles.noResults}>
                                <div style={styles.noResultsIcon}>🔍</div>
                                <h3 style={styles.noResultsTitle}>No results found</h3>
                                <p style={styles.noResultsText}>
                                    Try searching with different keywords or browse our products and services.
                                </p>
                                <div style={styles.suggestions}>
                                    <button
                                        style={styles.suggestionButton}
                                        onClick={() => navigate('/client-products')}
                                    >
                                        Browse Products
                                    </button>
                                    <button
                                        style={styles.suggestionButton}
                                        onClick={() => navigate('/client-services')}
                                    >
                                        Browse Services
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            <Footer />
        </div>
    );
};

const styles = {
    container: {
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '40px 20px',
        minHeight: '60vh',
    },
    header: {
        marginBottom: '40px',
        textAlign: 'center',
    },
    title: {
        fontSize: '2.5rem',
        fontWeight: '700',
        color: 'var(--color-dark-brown)',
        marginBottom: '10px',
        fontFamily: 'var(--font-heading-playfair)',
    },
    query: {
        fontSize: '1.1rem',
        color: '#666',
        marginBottom: '5px',
        fontFamily: 'var(--font-body-inter)',
    },
    count: {
        fontSize: '1rem',
        color: '#999',
        fontFamily: 'var(--font-body-inter)',
    },
    loading: {
        textAlign: 'center',
        padding: '60px 20px',
        fontSize: '1.2rem',
        color: '#666',
    },
    section: {
        marginBottom: '50px',
    },
    sectionTitle: {
        fontSize: '1.8rem',
        fontWeight: '600',
        color: 'var(--color-dark-brown)',
        marginBottom: '25px',
        fontFamily: 'var(--font-heading-playfair)',
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '25px',
    },
    card: {
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '25px',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        textAlign: 'center',
    },
    icon: {
        fontSize: '3rem',
        marginBottom: '15px',
    },
    productImage: {
        width: '100%',
        height: '200px',
        objectFit: 'cover',
        borderRadius: '8px',
        marginBottom: '15px',
    },
    cardTitle: {
        fontSize: '1.3rem',
        fontWeight: '600',
        color: 'var(--color-dark-brown)',
        marginBottom: '10px',
        fontFamily: 'var(--font-heading-playfair)',
    },
    cardDescription: {
        fontSize: '0.95rem',
        color: '#666',
        marginBottom: '15px',
        lineHeight: '1.5',
        fontFamily: 'var(--font-body-inter)',
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
    },
    price: {
        fontSize: '1.2rem',
        fontWeight: '700',
        color: 'var(--color-dark-brown)',
        marginBottom: '15px',
        fontFamily: 'var(--font-body-inter)',
    },
    viewButton: {
        backgroundColor: 'var(--color-dark-brown)',
        color: 'white',
        border: 'none',
        padding: '10px 25px',
        borderRadius: '6px',
        fontSize: '0.95rem',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        fontFamily: 'var(--font-body-inter)',
    },
    noResults: {
        textAlign: 'center',
        padding: '60px 20px',
    },
    noResultsIcon: {
        fontSize: '4rem',
        marginBottom: '20px',
    },
    noResultsTitle: {
        fontSize: '1.8rem',
        fontWeight: '600',
        color: 'var(--color-dark-brown)',
        marginBottom: '10px',
        fontFamily: 'var(--font-heading-playfair)',
    },
    noResultsText: {
        fontSize: '1.1rem',
        color: '#666',
        marginBottom: '30px',
        fontFamily: 'var(--font-body-inter)',
    },
    suggestions: {
        display: 'flex',
        gap: '15px',
        justifyContent: 'center',
        flexWrap: 'wrap',
    },
    suggestionButton: {
        backgroundColor: 'var(--color-dark-brown)',
        color: 'white',
        border: 'none',
        padding: '12px 30px',
        borderRadius: '6px',
        fontSize: '1rem',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        fontFamily: 'var(--font-body-inter)',
    },
};

export default SearchResults;
