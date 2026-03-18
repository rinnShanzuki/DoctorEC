import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBrowsingHistory } from '../../context/BrowsingHistoryContext';
import { FaRobot, FaStar, FaMagic, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import API_CONFIG from '../../config/api.config';

/**
 * Recommendation Carousel Component
 * Displays AI/New Arrivals recommendations in a horizontal scrollable carousel
 */
const RecommendationCarousel = () => {
    const navigate = useNavigate();
    const { getAIRecommendations, viewedProducts, preferences, getRecommendations } = useBrowsingHistory();
    const [recommendations, setRecommendations] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [aiSource, setAiSource] = useState('');
    const [aiMessage, setAiMessage] = useState('');
    const carouselRef = useRef(null);

    // Check if user is logged in
    const isLoggedIn = () => {
        return !!localStorage.getItem('client_token');
    };

    useEffect(() => {
        const fetchRecommendations = async () => {
            setIsLoading(true);

            try {
                const aiResult = await getAIRecommendations(isLoggedIn());

                if (aiResult) {
                    if (aiResult.source === 'none') {
                        setRecommendations([]);
                        setAiSource('none');
                    } else if (aiResult.recommendations && aiResult.recommendations.length > 0) {
                        setRecommendations(aiResult.recommendations);
                        setAiSource(aiResult.source || 'ai');
                        setAiMessage(aiResult.message || '');
                    }
                }
            } catch (error) {
                console.error('Failed to fetch recommendations:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchRecommendations();
    }, [viewedProducts, preferences]);

    const scroll = (direction) => {
        if (carouselRef.current) {
            const scrollAmount = 280; // Card width + gap
            carouselRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    const handleProductClick = (product) => {
        navigate(`/products/${product.product_id || product.id}`);
    };

    // Don't show if source is 'none' or no recommendations
    if (aiSource === 'none' || (!isLoading && recommendations.length === 0)) {
        return null;
    }

    const isAIPowered = aiSource === 'ai' || aiSource === 'cached_ai' || aiSource === 'fallback';
    const isNewArrivals = aiSource === 'new_arrivals';
    const isRecentlyViewed = aiSource === 'recently_viewed';
    const displayTitle = isRecentlyViewed ? "Recently Viewed" : (isNewArrivals ? "New Arrivals" : (isAIPowered ? "Recommended For You" : "Popular Products"));
    const subtitle = aiMessage || (isRecentlyViewed ? "Products you've browsed" : (isNewArrivals ? "Fresh products this month" : "Powered by AI"));

    return (
        <div style={styles.container}>
            {/* Header */}
            <div style={styles.header}>
                <div style={styles.headerLeft}>
                    <div style={{
                        ...styles.iconBox,
                        backgroundColor: isRecentlyViewed ? '#8B7355' : (isNewArrivals ? '#FF9500' : (isAIPowered ? '#1a73e8' : '#5D4E37'))
                    }}>
                        {isRecentlyViewed ? (
                            <FaStar style={styles.icon} />
                        ) : isNewArrivals ? (
                            <FaStar style={styles.icon} />
                        ) : isAIPowered ? (
                            <FaRobot style={styles.icon} />
                        ) : (
                            <FaMagic style={styles.icon} />
                        )}
                    </div>
                    <div>
                        <div style={styles.titleRow}>
                            <h3 style={styles.title}>{displayTitle}</h3>
                            {isAIPowered && <span style={styles.badgeAI}>GPT-4o</span>}
                            {isNewArrivals && <span style={styles.badgeNew}>NEW</span>}
                            {isRecentlyViewed && <span style={{ ...styles.badgeNew, backgroundColor: '#8B7355' }}>HISTORY</span>}
                        </div>
                        <p style={styles.subtitle}>
                            {isLoading ? 'Finding products for you...' : subtitle}
                        </p>
                    </div>
                </div>
                <div style={styles.navButtons}>
                    <button style={styles.navBtn} onClick={() => scroll('left')}>
                        <FaChevronLeft />
                    </button>
                    <button style={styles.navBtn} onClick={() => scroll('right')}>
                        <FaChevronRight />
                    </button>
                </div>
            </div>

            {/* Carousel */}
            {isLoading ? (
                <div style={styles.loadingContainer}>
                    <div style={styles.loadingCard}></div>
                    <div style={styles.loadingCard}></div>
                    <div style={styles.loadingCard}></div>
                    <div style={styles.loadingCard}></div>
                </div>
            ) : (
                <div ref={carouselRef} style={styles.carousel}>
                    {recommendations.map((product, index) => (
                        <div
                            key={product.product_id || index}
                            style={styles.card}
                            onClick={() => handleProductClick(product)}
                        >
                            <div style={styles.imageWrapper}>
                                <img
                                    src={product.image ? `${API_CONFIG.BASE_URL.replace('/api/v1', '')}/storage/${product.image}` : '/placeholder.jpg'}
                                    alt={product.name}
                                    style={styles.image}
                                    onError={(e) => { e.target.src = '/placeholder.jpg'; }}
                                />
                            </div>
                            <div style={styles.cardContent}>
                                <h4 style={styles.productName}>{product.name}</h4>
                                <p style={styles.productCategory}>{product.category}</p>
                                <p style={styles.productPrice}>₱{parseFloat(product.price).toLocaleString()}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const styles = {
    container: {
        backgroundColor: '#FFF8F0',
        borderRadius: '16px',
        padding: '25px',
        marginBottom: '40px',
        border: '1px solid #E8D5C4'
    },
    header: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '12px'
    },
    headerLeft: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
    },
    iconBox: {
        width: '40px',
        height: '40px',
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    },
    icon: {
        color: '#fff',
        fontSize: '18px'
    },
    titleRow: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
    },
    title: {
        margin: 0,
        color: '#5D4E37',
        fontSize: '1.1rem',
        fontWeight: 700,
        fontFamily: 'Calibri, sans-serif'
    },
    badgeAI: {
        backgroundColor: '#1a73e8',
        color: 'white',
        padding: '2px 8px',
        borderRadius: '10px',
        fontSize: '10px',
        fontWeight: 600
    },
    badgeNew: {
        backgroundColor: '#FF9500',
        color: 'white',
        padding: '2px 8px',
        borderRadius: '10px',
        fontSize: '10px',
        fontWeight: 600
    },
    subtitle: {
        margin: 0,
        color: '#8B7355',
        fontSize: '12px',
        fontFamily: 'Calibri, sans-serif'
    },
    navButtons: {
        display: 'flex',
        gap: '8px'
    },
    navBtn: {
        width: '36px',
        height: '36px',
        borderRadius: '50%',
        border: '1px solid #E8D5C4',
        backgroundColor: '#fff',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#5D4E37',
        transition: 'all 0.2s ease'
    },
    carousel: {
        display: 'flex',
        gap: '16px',
        overflowX: 'auto',
        scrollSnapType: 'x mandatory',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        paddingBottom: '10px'
    },
    loadingContainer: {
        display: 'flex',
        gap: '16px',
        overflowX: 'hidden'
    },
    loadingCard: {
        minWidth: '250px',
        height: '280px',
        borderRadius: '12px',
        backgroundColor: '#f0e6dc',
        animation: 'pulse 1.5s infinite'
    },
    card: {
        minWidth: '250px',
        maxWidth: '250px',
        backgroundColor: '#fff',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        cursor: 'pointer',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        scrollSnapAlign: 'start'
    },
    imageWrapper: {
        width: '100%',
        height: '180px',
        overflow: 'hidden'
    },
    image: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        transition: 'transform 0.3s ease'
    },
    cardContent: {
        padding: '12px'
    },
    productName: {
        margin: '0 0 4px 0',
        fontSize: '14px',
        fontWeight: 600,
        color: '#5D4E37',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
    },
    productCategory: {
        margin: '0 0 6px 0',
        fontSize: '12px',
        color: '#8B7355'
    },
    productPrice: {
        margin: 0,
        fontSize: '16px',
        fontWeight: 700,
        color: '#C4A484'
    }
};

// Add hover and scrollbar styles
const styleSheet = document.createElement("style");
styleSheet.innerText = `
    .recommendation-carousel::-webkit-scrollbar {
        display: none;
    }
    @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
    }
`;
document.head.appendChild(styleSheet);

export default RecommendationCarousel;
