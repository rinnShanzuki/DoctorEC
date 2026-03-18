import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBrowsingHistory } from '../../context/BrowsingHistoryContext';
import { FaRobot, FaStar, FaMagic, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

/**
 * AI Recommendations Component with Auto-Moving Carousel
 * Features: Auto-slide, navigation arrows on sides, 3 visible cards
 */
const AIRecommendations = ({ products, title }) => {
    const navigate = useNavigate();
    const { getRecommendations, getAIRecommendations, viewedProducts, preferences } = useBrowsingHistory();
    const [recommendations, setRecommendations] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [aiSource, setAiSource] = useState('');
    const [aiMessage, setAiMessage] = useState('');
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const autoSlideRef = useRef(null);

    const isLoggedIn = () => !!localStorage.getItem('client_token');

    // Fetch recommendations
    useEffect(() => {
        const fetchRecommendations = async () => {
            if (!products || products.length === 0) return;
            setIsLoading(true);

            try {
                const aiResult = await getAIRecommendations(isLoggedIn());
                if (aiResult) {
                    if (aiResult.source === 'none') {
                        setRecommendations([]);
                        setAiSource('none');
                    } else if (aiResult.recommendations?.length > 0) {
                        setRecommendations(aiResult.recommendations);
                        setAiSource(aiResult.source || 'ai');
                        setAiMessage(aiResult.message || '');
                    } else {
                        const recs = getRecommendations(products, 6);
                        setRecommendations(recs);
                        setAiSource('algorithm');
                    }
                } else {
                    const recs = getRecommendations(products, 6);
                    setRecommendations(recs);
                    setAiSource('algorithm');
                }
            } catch (error) {
                console.error('AI recommendation failed:', error);
                const recs = getRecommendations(products, 6);
                setRecommendations(recs);
                setAiSource('algorithm');
            } finally {
                setIsLoading(false);
            }
        };

        fetchRecommendations();
    }, [products, viewedProducts, preferences]);

    // Auto-slide effect
    useEffect(() => {
        if (recommendations.length === 0 || isPaused) return;

        autoSlideRef.current = setInterval(() => {
            setCurrentIndex((prev) => {
                const maxIndex = Math.max(0, recommendations.length - 3);
                return prev >= maxIndex ? 0 : prev + 1;
            });
        }, 3000); // Slide every 3 seconds

        return () => {
            if (autoSlideRef.current) clearInterval(autoSlideRef.current);
        };
    }, [recommendations.length, isPaused]);

    const handlePrev = () => {
        setCurrentIndex((prev) => {
            const maxIndex = Math.max(0, recommendations.length - 3);
            return prev <= 0 ? maxIndex : prev - 1;
        });
    };

    const handleNext = () => {
        setCurrentIndex((prev) => {
            const maxIndex = Math.max(0, recommendations.length - 3);
            return prev >= maxIndex ? 0 : prev + 1;
        });
    };

    const handleProductClick = (product) => {
        navigate(`/products/${product.product_id || product.id}`);
    };

    // Don't show if no products or source is 'none'
    if (!products?.length || aiSource === 'none' || (!isLoading && recommendations.length === 0)) {
        return null;
    }

    const isAIPowered = ['ai', 'cached_ai', 'fallback'].includes(aiSource);
    const isNewArrivals = aiSource === 'new_arrivals';
    const isRecentlyViewed = aiSource === 'recently_viewed';
    const displayTitle = title || (isRecentlyViewed ? "Recently Viewed" : (isNewArrivals ? "New Arrivals" : (isAIPowered ? "Recommended For You" : "Popular Products")));
    const subtitle = aiMessage || (isRecentlyViewed ? "Products you've browsed" : (isNewArrivals ? "Fresh products this month" : (isAIPowered ? "Powered by AI" : "Explore our collection")));

    return (
        <div style={styles.container}>
            {/* Header */}
            <div style={styles.header}>
                <div style={styles.headerLeft}>
                    <div style={{
                        ...styles.iconBox,
                        backgroundColor: isRecentlyViewed ? '#8B7355' : (isNewArrivals ? '#FF9500' : (isAIPowered ? '#1a73e8' : '#5D4E37'))
                    }}>
                        {isRecentlyViewed ? <FaStar style={styles.icon} /> :
                            isNewArrivals ? <FaStar style={styles.icon} /> :
                                isAIPowered ? <FaRobot style={styles.icon} /> :
                                    <FaMagic style={styles.icon} />}
                    </div>
                    <div>
                        <div style={styles.titleRow}>
                            <h3 style={styles.title}>{displayTitle}</h3>
                            {isAIPowered && <span style={styles.badgeAI}>GPT-4o</span>}
                            {isNewArrivals && <span style={styles.badgeNew}>NEW</span>}
                            {isRecentlyViewed && <span style={{ ...styles.badgeNew, backgroundColor: '#8B7355' }}>HISTORY</span>}
                        </div>
                        <p style={styles.subtitle}>{isLoading ? 'Finding products...' : subtitle}</p>
                    </div>
                </div>
            </div>

            {/* Carousel Container */}
            <div
                style={styles.carouselWrapper}
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
            >
                {/* Left Arrow */}
                <button onClick={handlePrev} style={styles.arrowLeft}>
                    <FaChevronLeft style={{ fontSize: '18px' }} />
                </button>

                {/* Cards Track */}
                <div style={styles.carouselTrack}>
                    <div style={{
                        display: 'flex',
                        gap: '16px',
                        transform: `translateX(-${currentIndex * 252}px)`,
                        transition: 'transform 0.5s ease-in-out'
                    }}>
                        {isLoading ? (
                            [...Array(4)].map((_, i) => (
                                <div key={i} style={styles.skeletonCard}>
                                    <div style={styles.skeletonImage}></div>
                                    <div style={styles.skeletonText}></div>
                                    <div style={styles.skeletonPrice}></div>
                                </div>
                            ))
                        ) : (
                            recommendations.map((product, idx) => (
                                <div
                                    key={product.product_id || idx}
                                    onClick={() => handleProductClick(product)}
                                    style={styles.card}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'scale(1.03)';
                                        e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'scale(1)';
                                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                                    }}
                                >
                                    <div style={styles.imageWrapper}>
                                        <img
                                            src={`http://localhost:8000/storage/${product.image}`}
                                            alt={product.name}
                                            style={styles.image}
                                            onError={(e) => { e.target.src = 'https://via.placeholder.com/220x160?text=No+Image'; }}
                                        />
                                    </div>
                                    <div style={styles.cardContent}>
                                        <h4 style={styles.productName}>{product.name}</h4>
                                        <p style={styles.productPrice}>₱{parseFloat(product.price).toLocaleString()}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Right Arrow */}
                <button onClick={handleNext} style={styles.arrowRight}>
                    <FaChevronRight style={{ fontSize: '18px' }} />
                </button>
            </div>

            {/* Dots Indicator */}
            <div style={styles.dotsContainer}>
                {recommendations.slice(0, Math.max(1, recommendations.length - 2)).map((_, idx) => (
                    <button
                        key={idx}
                        onClick={() => setCurrentIndex(idx)}
                        style={{
                            ...styles.dot,
                            backgroundColor: currentIndex === idx ? '#5D4E37' : '#D4C4B0'
                        }}
                    />
                ))}
            </div>
        </div>
    );
};

const styles = {
    container: {
        backgroundColor: '#FFF8F0',
        borderRadius: '16px',
        padding: '30px 20px',
        marginBottom: '30px',
        position: 'relative',
        border: '1px solid #E8D5C4'
    },
    header: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '25px',
        paddingLeft: '40px'
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
    icon: { color: '#fff', fontSize: '18px' },
    titleRow: { display: 'flex', alignItems: 'center', gap: '10px' },
    title: {
        margin: 0,
        color: '#5D4E37',
        fontSize: '1.3rem',
        fontWeight: 700,
        fontFamily: 'Calibri, sans-serif'
    },
    badgeAI: {
        backgroundColor: '#1a73e8',
        color: 'white',
        padding: '3px 10px',
        borderRadius: '12px',
        fontSize: '11px',
        fontWeight: 600
    },
    badgeNew: {
        backgroundColor: '#FF9500',
        color: 'white',
        padding: '3px 10px',
        borderRadius: '12px',
        fontSize: '11px',
        fontWeight: 600
    },
    subtitle: {
        margin: '4px 0 0 0',
        color: '#8B7355',
        fontSize: '13px'
    },
    carouselWrapper: {
        position: 'relative',
        overflow: 'hidden',
        padding: '0 50px'
    },
    carouselTrack: {
        overflow: 'hidden'
    },
    arrowLeft: {
        position: 'absolute',
        left: '5px',
        top: '50%',
        transform: 'translateY(-50%)',
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        backgroundColor: 'rgba(93, 78, 55, 0.8)',
        border: 'none',
        color: '#fff',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
        transition: 'background-color 0.2s'
    },
    arrowRight: {
        position: 'absolute',
        right: '5px',
        top: '50%',
        transform: 'translateY(-50%)',
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        backgroundColor: 'rgba(93, 78, 55, 0.8)',
        border: 'none',
        color: '#fff',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
        transition: 'background-color 0.2s'
    },
    card: {
        minWidth: '236px',
        maxWidth: '236px',
        flexShrink: 0,
        backgroundColor: '#fff',
        borderRadius: '12px',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'transform 0.3s, box-shadow 0.3s',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        border: '1px solid #E8D5C4'
    },
    imageWrapper: {
        width: '100%',
        height: '160px',
        overflow: 'hidden',
        backgroundColor: '#F5F1EE'
    },
    image: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        transition: 'transform 0.3s'
    },
    cardContent: {
        padding: '15px',
        textAlign: 'center'
    },
    productName: {
        margin: '0 0 8px 0',
        fontSize: '15px',
        fontWeight: 600,
        color: '#5D4E37',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
    },
    productPrice: {
        margin: 0,
        fontSize: '14px',
        color: '#C4A484',
        fontWeight: 600
    },
    skeletonCard: {
        minWidth: '236px',
        maxWidth: '236px',
        backgroundColor: '#fff',
        borderRadius: '12px',
        overflow: 'hidden',
        border: '1px solid #E8D5C4'
    },
    skeletonImage: {
        width: '100%',
        height: '160px',
        backgroundColor: '#F0E6DC',
        animation: 'pulse 1.5s infinite'
    },
    skeletonText: {
        margin: '15px',
        height: '16px',
        backgroundColor: '#F0E6DC',
        borderRadius: '4px'
    },
    skeletonPrice: {
        margin: '0 15px 15px',
        height: '14px',
        width: '60px',
        backgroundColor: '#F0E6DC',
        borderRadius: '4px'
    },
    dotsContainer: {
        display: 'flex',
        justifyContent: 'center',
        gap: '8px',
        marginTop: '20px'
    },
    dot: {
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        border: 'none',
        cursor: 'pointer',
        transition: 'background-color 0.2s'
    }
};

// Add keyframes for skeleton animation
const styleSheet = document.createElement("style");
styleSheet.innerText = `
    @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
    }
`;
document.head.appendChild(styleSheet);

export default AIRecommendations;
