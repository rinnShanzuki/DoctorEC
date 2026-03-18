import React, { useState, useMemo } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ProductDetailsModal from '../components/ProductDetailsModal';
import SignUpModal from '../components/SignUpModal';
import SignInModal from '../components/SignInModal';
import { FaChevronDown, FaChevronUp, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { useShop } from '../../context/ShopContext'; // Import Context
import featured4 from '../../assets/featured4.jpg';

const Products = () => {
    // Use Shop Context for Data
    const { products, loading } = useShop();

    const [currentPage, setCurrentPage] = useState(1);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSignInOpen, setIsSignInOpen] = useState(false);

    // Filter States
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [priceRange, setPriceRange] = useState([0, 3000]);
    const [isCategoryOpen, setIsCategoryOpen] = useState(true);

    // 4 columns * 3 rows = 12 products per page
    const productsPerPage = 12;

    // Derived Data (Filtering)
    const filteredProducts = useMemo(() => {
        return products.filter((product) => {
            const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (product.grade_info && product.grade_info.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (product.shape && product.shape.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (product.frame_color && product.frame_color.toLowerCase().includes(searchTerm.toLowerCase()));

            // Map backend 'category' to 'Target Audience' logic if needed, or just use category
            // The static data used 'target_audience' for categories (Men, Women, Kids).
            // The backend data has 'category' (Frames, Sunglasses, etc.) AND 'target_audience' (Men, Women, etc.)
            // We'll filter by target_audience to match the sidebar buttons.
            const matchesCategory = selectedCategory === 'All' ||
                (product.target_audience === selectedCategory) ||
                (product.category === selectedCategory); // Fallback

            const matchesPrice = product.price >= priceRange[0] && product.price <= priceRange[1];

            return matchesSearch && matchesCategory && matchesPrice;
        });
    }, [products, searchTerm, selectedCategory, priceRange]);

    // Pagination Logic
    const indexOfLastProduct = currentPage * productsPerPage;
    const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
    const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);
    const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    const handleViewDetails = (product) => {
        setSelectedProduct(product);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedProduct(null);
    };

    const [showReserveConfirm, setShowReserveConfirm] = useState(false);

    const handleReserve = (product) => {
        // Show confirmation modal instead of immediate sign in
        setSelectedProduct(product);
        setShowReserveConfirm(true);
    };

    const confirmReserve = () => {
        setShowReserveConfirm(false);
        setIsSignInOpen(true);
    };

    const cancelReserve = () => {
        setShowReserveConfirm(false);
    };

    const handleReserveFromModal = () => {
        handleCloseModal();
        handleReserve(selectedProduct);
    };

    // Categories
    const categories = ['All', 'Kids', 'Men', 'Women'];

    return (
        <div style={styles.pageWrapper}>

            {/* Static Hero Section */}
            <div style={styles.heroContainer}>
                <img src={featured4} alt="Premium Eyewear" style={styles.heroImage} />
                <div style={styles.heroOverlay}>
                    <h2 style={styles.heroTitle}>Premium Eyewear Collection</h2>
                    <p style={styles.heroSubtitle}>Discover the perfect look for you.</p>
                </div>
            </div>

            <div className="container" style={styles.container}>
                <h1 style={styles.title}>Our Collection</h1>
                <p style={styles.subtitle}>Discover our wide range of premium eyewear.</p>

                <div style={styles.contentWrapper} className="contentWrapper">
                    {/* Sidebar Filters */}
                    <aside style={styles.sidebar}>
                        <div style={styles.filterSection}>
                            <h3 style={styles.filterTitle}>Search</h3>
                            <input
                                type="text"
                                placeholder="Search grade, color, shape..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={styles.searchInput}
                            />
                        </div>

                        {/* Categories (Target Audience) */}
                        <div style={styles.filterSection}>
                            <div
                                style={styles.categoryHeader}
                                onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                            >
                                <h3 style={{ ...styles.filterTitle, marginBottom: 0 }}>Categories</h3>
                                {isCategoryOpen ? <FaChevronUp /> : <FaChevronDown />}
                            </div>

                            {isCategoryOpen && (
                                <div style={styles.categoryList}>
                                    {categories.map(cat => (
                                        <button
                                            key={cat}
                                            onClick={() => { setSelectedCategory(cat); setCurrentPage(1); }}
                                            style={{
                                                ...styles.categoryBtn,
                                                ...(selectedCategory === cat ? styles.activeCategoryBtn : {})
                                            }}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div style={styles.filterSection}>
                            <h3 style={styles.filterTitle}>Price Range</h3>
                            <p style={styles.priceLabel}>Max: ₱{priceRange[1]}</p>
                            <input
                                type="range"
                                min="0"
                                max="3000"
                                step="100"
                                value={priceRange[1]}
                                onChange={(e) => setPriceRange([0, parseInt(e.target.value)])}
                                style={styles.rangeInput}
                            />
                        </div>
                    </aside>

                    {/* Product Grid */}
                    <main style={styles.mainContent}>
                        {loading ? (
                            <div style={{ textAlign: 'center', padding: '50px' }}>Loading products...</div>
                        ) : currentProducts.length > 0 ? (
                            <div style={styles.grid} className="grid">
                                {currentProducts.map((product) => (
                                    <div key={product.id} style={styles.card} className="product-card">
                                        <div style={styles.imageWrapper} className="image-wrapper">
                                            <img src={product.image} alt={product.name} style={styles.image} className="product-image" />
                                            <div className="overlay">
                                                <button
                                                    style={styles.viewBtn}
                                                    onClick={() => handleViewDetails(product)}
                                                    className="action-btn"
                                                >
                                                    View Details
                                                </button>
                                                <button
                                                    style={styles.reserveBtnOverlay}
                                                    onClick={() => handleReserve(product)}
                                                    className="action-btn"
                                                >
                                                    Reserve
                                                </button>
                                            </div>
                                        </div>
                                        {/* Name and Price Hidden on Card */}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={styles.noResults}>
                                <p>No products found matching your criteria.</p>
                            </div>
                        )}

                        {/* Dot Pagination with Arrows */}
                        {totalPages > 1 && (
                            <div style={styles.pagination}>
                                <button
                                    onClick={() => paginate(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                                        color: 'var(--color-dark-brown)',
                                        fontSize: '1rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        padding: '0 10px',
                                        opacity: currentPage === 1 ? 0.5 : 1
                                    }}
                                >
                                    <FaChevronLeft />
                                </button>

                                {Array.from({ length: totalPages }, (_, i) => (
                                    <button
                                        key={i + 1}
                                        onClick={() => paginate(i + 1)}
                                        style={{
                                            width: '10px',
                                            height: '10px',
                                            borderRadius: '50%',
                                            border: 'none',
                                            backgroundColor: currentPage === i + 1 ? 'var(--color-dark-brown)' : '#ccc',
                                            cursor: 'pointer',
                                            padding: 0,
                                            margin: '0 4px',
                                            transition: 'background-color 0.3s'
                                        }}
                                        title={`Page ${i + 1}`}
                                    />
                                ))}

                                <button
                                    onClick={() => paginate(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                                        color: 'var(--color-dark-brown)',
                                        fontSize: '1rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        padding: '0 10px',
                                        opacity: currentPage === totalPages ? 0.5 : 1
                                    }}
                                >
                                    <FaChevronRight />
                                </button>
                            </div>
                        )}
                    </main>
                </div>
            </div>

            <ProductDetailsModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                product={selectedProduct}
                onReserve={handleReserveFromModal}
            />

            <SignInModal
                isOpen={isSignInOpen}
                onClose={() => setIsSignInOpen(false)}
            />

            {/* Reserve Confirmation Modal */}
            {showReserveConfirm && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalContent}>
                        <h3 style={styles.modalTitle}>Reserve Product</h3>
                        <p style={styles.modalText}>You need to sign up to reserve. Proceed?</p>
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
    pageWrapper: {
        minHeight: '100vh',
        backgroundColor: 'var(--color-cream-white)',
    },
    container: {
        maxWidth: 'var(--max-width)',
        margin: '0 auto',
        padding: '60px 20px 60px',
    },
    heroContainer: {
        width: '100%',
        height: '50vh',
        position: 'relative',
        overflow: 'hidden',
        marginBottom: '0',
    },
    heroImage: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        filter: 'blur(2px)',
    },
    heroOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0,0,0,0.3)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        textAlign: 'center',
    },
    heroTitle: {
        fontFamily: 'var(--font-heading-poppins)',
        fontSize: '4rem',
        marginBottom: '20px',
        textShadow: '0 2px 4px rgba(0,0,0,0.5)',
        color: 'var(--color-cream-white)',
    },
    heroSubtitle: {
        fontFamily: 'var(--font-body-inter)',
        fontSize: '1.5rem',
        textShadow: '0 1px 2px rgba(0,0,0,0.5)',
    },
    title: {
        fontFamily: 'var(--font-heading-poppins)',
        fontSize: '2.5rem',
        color: 'var(--color-dark-brown)',
        textAlign: 'center',
        marginBottom: '10px',
        marginTop: '60px',
    },
    subtitle: {
        fontFamily: 'var(--font-body-inter)',
        fontSize: '1.1rem',
        color: 'var(--color-text-secondary)',
        textAlign: 'center',
        marginBottom: '40px',
    },
    contentWrapper: {
        display: 'flex',
        gap: '40px',
        alignItems: 'flex-start',
    },
    sidebar: {
        flex: '0 0 250px',
        backgroundColor: 'rgba(255, 255, 255, 0.6)',
        padding: '30px',
        borderRadius: '20px',
        position: 'sticky',
        top: '120px',
    },
    mainContent: {
        flex: '1',
    },
    filterSection: {
        marginBottom: '30px',
    },
    filterTitle: {
        fontFamily: 'var(--font-heading-montserrat)',
        fontSize: '1.1rem',
        color: 'var(--color-dark-brown)',
        marginBottom: '15px',
        fontWeight: '600',
    },
    categoryHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        cursor: 'pointer',
        marginBottom: '15px',
    },
    searchInput: {
        width: '100%',
        padding: '10px 15px',
        borderRadius: '10px',
        border: '1px solid #ddd',
        fontSize: '0.9rem',
        fontFamily: 'var(--font-body-inter)',
        outline: 'none',
    },
    categoryList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        animation: 'slideDown 0.3s ease-out',
    },
    categoryBtn: {
        textAlign: 'left',
        padding: '8px 12px',
        borderRadius: '8px',
        border: 'none',
        backgroundColor: 'transparent',
        color: 'var(--color-text-secondary)',
        cursor: 'pointer',
        fontFamily: 'var(--font-body-inter)',
        fontSize: '0.95rem',
        transition: 'all 0.2s ease',
    },
    activeCategoryBtn: {
        backgroundColor: 'var(--color-dark-brown)',
        color: 'var(--color-white)',
        fontWeight: '500',
    },
    priceLabel: {
        fontFamily: 'var(--font-body-inter)',
        fontSize: '0.9rem',
        color: 'var(--color-dark-brown)',
        marginBottom: '10px',
    },
    rangeInput: {
        width: '100%',
        cursor: 'pointer',
        accentColor: 'var(--color-dark-brown)',
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)', // 4 Columns
        gap: '20px',
    },
    card: {
        cursor: 'pointer',
        backgroundColor: 'transparent',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
    },
    imageWrapper: {
        width: '100%',
        paddingTop: '100%', // 1:1 Aspect Ratio
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '0',
        backgroundColor: '#fff',
        boxShadow: '0 5px 15px rgba(0,0,0,0.05)',
        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    },
    image: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        transition: 'all 0.5s ease',
    },
    reserveBtnOverlay: {
        backgroundColor: 'var(--color-dark-brown)',
        color: 'white',
        padding: '10px 20px',
        fontSize: '0.85rem',
        fontWeight: '600',
        border: 'none',
        borderRadius: '30px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
        cursor: 'pointer',
        width: '140px',
        transition: 'all 0.3s ease',
    },
    viewBtn: {
        backgroundColor: 'var(--color-white)',
        color: 'var(--color-dark-brown)',
        padding: '10px 20px',
        fontSize: '0.85rem',
        fontWeight: '600',
        border: 'none',
        borderRadius: '30px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
        cursor: 'pointer',
        width: '140px',
        transition: 'all 0.3s ease',
    },
    noResults: {
        textAlign: 'center',
        color: 'var(--color-text-secondary)',
        fontSize: '1.2rem',
        marginTop: '60px',
    },
    pagination: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: '60px',
        gap: '10px',
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

// Inject advanced hover styles
const styleSheet = document.createElement("style");
styleSheet.innerText = `
    .image-wrapper:hover .product-image {
        transform: scale(1.1);
        filter: blur(4px); /* Blur effect on hover */
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
        backdrop-filter: blur(2px);
        display: flex;
        flex-direction: column;
        gap: 10px;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: all 0.3s ease;
    }

    .action-btn {
        transform: translateY(20px);
        opacity: 0;
        transition: all 0.3s ease;
    }
    .image-wrapper:hover .action-btn {
        transform: translateY(0);
        opacity: 1;
    }

    .view-btn:hover {
        transform: scale(1.05) !important;
    }
    
    @keyframes slideDown {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
    }
    @media (max-width: 1024px) {
        .grid { grid-template-columns: repeat(2, 1fr) !important; }
    }
    @media (max-width: 768px) {
        .contentWrapper { flex-direction: column; }
        .sidebar { width: 100%; position: static; }
        .grid { grid-template-columns: repeat(2, 1fr) !important; }
    }
    @media (max-width: 480px) {
        .grid { grid-template-columns: 1fr !important; }
    }
`;
document.head.appendChild(styleSheet);

export default Products;
