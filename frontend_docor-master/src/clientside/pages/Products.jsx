import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ProductDetailsModal from '../components/ProductDetailsModal';
import SignInModal from '../components/SignInModal';
import AIRecommendations from '../components/AIRecommendations';
import { FaChevronDown, FaChevronUp, FaChevronLeft, FaChevronRight, FaTh, FaList } from 'react-icons/fa';
import { useShop } from '../../context/ShopContext';
import { useBrowsingHistory } from '../../context/BrowsingHistoryContext';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { useAuth } from '../../context/AuthContext';
import featured4 from '../../assets/featured4.jpg';

const DEFAULT_CONFIG = {
    layout: 'grid-4',          // 'grid-4', 'grid-3', 'grid-2'
    show_prices: true,
    show_descriptions: false,
    show_names: true,
    filters_position: 'left',  // 'left', 'top'
    page_title: 'Our Collection',
    page_subtitle: 'Discover our wide range of premium eyewear.',
    filter_attributes: [
        { key: 'target_audience', label: 'Category', values: ['All', 'Kids', 'Men', 'Women'], enabled: true, type: 'buttons' },
        { key: 'price_range', label: 'Price Range', type: 'range', max: 3000, enabled: true },
    ],
};

const Products = () => {
    const { products, loading } = useShop();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { trackProductView } = useBrowsingHistory();
    const { getSetting } = useSiteSettings();

    const raw = getSetting('products_page_settings', DEFAULT_CONFIG);
    const config = { ...DEFAULT_CONFIG, ...(typeof raw === 'string' ? JSON.parse(raw) : raw) };

    const [currentPage, setCurrentPage] = useState(1);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSignInOpen, setIsSignInOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({});
    const [openSections, setOpenSections] = useState({});
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    // Detect mobile for compact filters
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Initialize filters from URL params
    useEffect(() => {
        const s = searchParams.get('search');
        const c = searchParams.get('category');
        if (s) setSearchTerm(s);
        if (c) setFilters(prev => ({ ...prev, target_audience: c }));
    }, [searchParams]);

    // Grid columns based on layout setting
    const gridCols = config.layout === 'grid-2' ? 2 : config.layout === 'grid-3' ? 3 : 4;
    const productsPerPage = gridCols * 3;

    // Get enabled filter attributes
    const enabledFilters = (config.filter_attributes || []).filter(f => f.enabled);

    // Filtering logic
    const filteredProducts = useMemo(() => {
        return products.filter((product) => {
            // Search
            if (searchTerm) {
                const q = searchTerm.toLowerCase();
                const matchesSearch = (product.name || '').toLowerCase().includes(q) ||
                    (product.grade_info || '').toLowerCase().includes(q) ||
                    (product.shape || '').toLowerCase().includes(q) ||
                    (product.frame_color || '').toLowerCase().includes(q) ||
                    (product.category || '').toLowerCase().includes(q);
                if (!matchesSearch) return false;
            }

            // Dynamic attribute filters
            for (const attr of enabledFilters) {
                const filterVal = filters[attr.key];
                if (!filterVal || filterVal === 'All') continue;

                if (attr.type === 'range') {
                    if (product.price > filterVal) return false;
                } else {
                    // String match
                    const productVal = product[attr.key] || '';
                    if (productVal !== filterVal) return false;
                }
            }
            return true;
        });
    }, [products, searchTerm, filters, enabledFilters]);

    // Pagination
    const indexOfLast = currentPage * productsPerPage;
    const indexOfFirst = indexOfLast - productsPerPage;
    const currentProducts = filteredProducts.slice(indexOfFirst, indexOfLast);
    const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
    const paginate = (n) => setCurrentPage(n);

    const handleViewDetails = (product) => {
        setSelectedProduct(product);
        setIsModalOpen(true);
        trackProductView(product);
    };

    const toggleSection = (key) => {
        setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const renderFilters = () => {
        if (isMobile) {
            return (
                <aside style={styles.sidebar}>
                    {/* Search - full width alone */}
                    <div style={styles.filterSection}>
                        <h3 style={styles.filterTitle}>Search</h3>
                        <input type="text" placeholder="Search products..." value={searchTerm}
                            onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }} style={styles.searchInput} />
                    </div>
                    {/* Filters in 2-column grid */}
                    <div style={styles.mobileFiltersGrid}>
                        {enabledFilters.map(attr => (
                            <div key={attr.key} style={attr.type === 'range' ? styles.mobileFilterItemFull : styles.mobileFilterItem}>
                                {attr.type === 'range' ? (
                                    <>
                                        <label style={styles.filterTitle}>{attr.label}</label>
                                        <p style={styles.priceLabel}>Max: ₱{filters[attr.key] || attr.max || 3000}</p>
                                        <input type="range" min="0" max={attr.max || 3000} step="100"
                                            value={filters[attr.key] || attr.max || 3000}
                                            onChange={e => { setFilters(prev => ({ ...prev, [attr.key]: parseInt(e.target.value) })); setCurrentPage(1); }}
                                            style={styles.rangeInput} />
                                    </>
                                ) : (
                                    <>
                                        <label style={styles.filterTitle}>{attr.label}</label>
                                        <select
                                            value={filters[attr.key] || 'All'}
                                            onChange={e => { setFilters(prev => ({ ...prev, [attr.key]: e.target.value })); setCurrentPage(1); }}
                                            style={styles.filterDropdown}
                                        >
                                            {(attr.values || []).map(val => (
                                                <option key={val} value={val}>{val}</option>
                                            ))}
                                        </select>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                </aside>
            );
        }

        return (
            <aside style={config.filters_position === 'top' ? styles.filtersTop : styles.sidebar}>
                {/* Search */}
                <div style={styles.filterSection}>
                    <h3 style={styles.filterTitle}>Search</h3>
                    <input type="text" placeholder="Search products..." value={searchTerm}
                        onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }} style={styles.searchInput} />
                </div>

                {/* Desktop: expandable button lists */}
                {enabledFilters.map(attr => (
                    <div key={attr.key} style={styles.filterSection}>
                        {attr.type === 'range' ? (
                            <>
                                <h3 style={styles.filterTitle}>{attr.label}</h3>
                                <p style={styles.priceLabel}>Max: ₱{filters[attr.key] || attr.max || 3000}</p>
                                <input type="range" min="0" max={attr.max || 3000} step="100"
                                    value={filters[attr.key] || attr.max || 3000}
                                    onChange={e => { setFilters(prev => ({ ...prev, [attr.key]: parseInt(e.target.value) })); setCurrentPage(1); }}
                                    style={styles.rangeInput} />
                            </>
                        ) : (
                            <>
                                <div style={styles.categoryHeader} onClick={() => toggleSection(attr.key)}>
                                    <h3 style={{ ...styles.filterTitle, marginBottom: 0 }}>{attr.label}</h3>
                                    {openSections[attr.key] === false ? <FaChevronDown /> : <FaChevronUp />}
                                </div>
                                {openSections[attr.key] !== false && (
                                    <div style={styles.categoryList}>
                                        {(attr.values || []).map(val => (
                                            <button key={val}
                                                onClick={() => { setFilters(prev => ({ ...prev, [attr.key]: val })); setCurrentPage(1); }}
                                                style={{
                                                    ...styles.categoryBtn,
                                                    ...(filters[attr.key] === val || (!filters[attr.key] && val === 'All') ? styles.activeCategoryBtn : {}),
                                                }}>
                                                {val}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                ))}
            </aside>
        );
    };

    return (
        <div style={styles.pageWrapper}>
            <Navbar />

            {/* Hero */}
            <div style={styles.heroContainer}>
                <img src={featured4} alt="Premium Eyewear" style={styles.heroImage} />
                <div style={styles.heroOverlay}>
                    <h2 style={styles.heroTitle}>Premium Eyewear Collection</h2>
                    <p style={styles.heroSubtitle}>Discover the perfect look for you.</p>
                </div>
            </div>

            <div className="container products-container" style={styles.container}>
                <AIRecommendations products={products} />

                <h1 style={styles.title}>{config.page_title}</h1>
                <p style={styles.subtitle}>{config.page_subtitle}</p>

                {config.filters_position === 'top' ? (
                    <>
                        {renderFilters()}
                        <main style={styles.mainContent}>
                            {renderProductGrid()}
                        </main>
                    </>
                ) : (
                    <div style={styles.contentWrapper} className="contentWrapper">
                        {renderFilters()}
                        <main style={styles.mainContent}>
                            {renderProductGrid()}
                        </main>
                    </div>
                )}
            </div>

            <Footer />

            <ProductDetailsModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setSelectedProduct(null); }} product={selectedProduct} />
            <SignInModal isOpen={isSignInOpen} onClose={() => setIsSignInOpen(false)} />
        </div>
    );

    function renderProductGrid() {
        if (loading) return <div style={{ textAlign: 'center', padding: '50px' }}>Loading products...</div>;
        if (currentProducts.length === 0) return <div style={styles.noResults}><p>No products found matching your criteria.</p></div>;

        return (
            <>
                <div style={{ ...styles.grid, gridTemplateColumns: `repeat(${gridCols}, 1fr)` }} className="grid">
                    {currentProducts.map((product) => (
                        <div key={product.id} style={styles.card} className="product-card">
                            <div style={styles.imageWrapper} className="image-wrapper">
                                <img src={product.image} alt={product.name} style={styles.image} className="product-image" />
                                <div className="overlay">
                                    <button style={styles.viewBtn} onClick={() => handleViewDetails(product)} className="action-btn">
                                        View Details
                                    </button>
                                </div>
                            </div>
                            {config.show_names && <p style={styles.productName}>{product.name}</p>}
                            {config.show_prices && <p style={styles.productPrice}>₱{parseFloat(product.price || 0).toFixed(2)}</p>}
                            {config.show_descriptions && product.description && <p style={styles.productDesc}>{product.description}</p>}
                        </div>
                    ))}
                </div>

                {totalPages > 1 && (
                    <div style={styles.pagination}>
                        <button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1}
                            style={{ ...styles.paginationArrow, opacity: currentPage === 1 ? 0.5 : 1 }}><FaChevronLeft /></button>
                        {Array.from({ length: totalPages }, (_, i) => (
                            <button key={i + 1} onClick={() => paginate(i + 1)}
                                style={{
                                    width: '10px', height: '10px', borderRadius: '50%', border: 'none',
                                    backgroundColor: currentPage === i + 1 ? 'var(--color-dark-brown)' : '#ccc',
                                    cursor: 'pointer', padding: 0, margin: '0 4px',
                                }} title={`Page ${i + 1}`} />
                        ))}
                        <button onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages}
                            style={{ ...styles.paginationArrow, opacity: currentPage === totalPages ? 0.5 : 1 }}><FaChevronRight /></button>
                    </div>
                )}
            </>
        );
    }
};

const styles = {
    pageWrapper: { minHeight: '100vh', backgroundColor: 'var(--color-cream-white)' },
    container: { maxWidth: 'var(--max-width)', margin: '0 auto', padding: '60px 20px 60px' },
    heroContainer: { width: '100%', height: '50vh', position: 'relative', overflow: 'hidden' },
    heroImage: { width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(2px)' },
    heroOverlay: {
        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
        backgroundColor: 'rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', color: 'white', textAlign: 'center',
    },
    heroTitle: { fontFamily: 'var(--font-heading-poppins)', fontSize: '4rem', marginBottom: '20px', textShadow: '0 2px 4px rgba(0,0,0,0.5)', color: 'var(--color-cream-white)' },
    heroSubtitle: { fontFamily: 'var(--font-body-inter)', fontSize: '1.5rem', textShadow: '0 1px 2px rgba(0,0,0,0.5)' },
    title: { fontFamily: 'var(--font-heading-poppins)', fontSize: '2.5rem', color: 'var(--color-dark-brown)', textAlign: 'center', marginBottom: '10px', marginTop: '60px' },
    subtitle: { fontFamily: 'var(--font-body-inter)', fontSize: '1.1rem', color: 'var(--color-text-secondary)', textAlign: 'center', marginBottom: '40px' },
    contentWrapper: { display: 'flex', gap: '40px', alignItems: 'flex-start' },
    sidebar: { flex: '0 0 250px', backgroundColor: 'rgba(255,255,255,0.6)', padding: '30px', borderRadius: '20px', position: 'sticky', top: '120px' },
    filtersTop: { display: 'flex', flexWrap: 'wrap', gap: '20px', marginBottom: '30px', backgroundColor: 'rgba(255,255,255,0.6)', padding: '20px', borderRadius: '12px' },
    mainContent: { flex: '1' },
    filterSection: { marginBottom: '30px' },
    filterTitle: { fontFamily: 'var(--font-heading-montserrat)', fontSize: '1.1rem', color: 'var(--color-dark-brown)', marginBottom: '15px', fontWeight: '600' },
    searchInput: { width: '100%', padding: '10px 15px', borderRadius: '10px', border: '1px solid #ddd', fontSize: '0.9rem', fontFamily: 'var(--font-body-inter)', outline: 'none' },
    categoryHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', marginBottom: '15px' },
    categoryList: { display: 'flex', flexDirection: 'column', gap: '10px' },
    categoryBtn: { textAlign: 'left', padding: '8px 12px', borderRadius: '8px', border: 'none', backgroundColor: 'transparent', color: 'var(--color-text-secondary)', cursor: 'pointer', fontFamily: 'var(--font-body-inter)', fontSize: '0.95rem', transition: 'all 0.2s ease' },
    activeCategoryBtn: { backgroundColor: 'var(--color-dark-brown)', color: 'var(--color-white)', fontWeight: '500' },
    priceLabel: { fontFamily: 'var(--font-body-inter)', fontSize: '0.9rem', color: 'var(--color-dark-brown)', marginBottom: '10px' },
    rangeInput: { width: '100%', cursor: 'pointer', accentColor: 'var(--color-dark-brown)' },
    filterDropdown: { width: '100%', padding: '10px 15px', borderRadius: '10px', border: '1px solid #ddd', fontSize: '0.9rem', fontFamily: 'var(--font-body-inter)', backgroundColor: 'white', color: 'var(--color-dark-brown)', outline: 'none', cursor: 'pointer' },
    mobileFiltersGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' },
    mobileFilterItem: { display: 'flex', flexDirection: 'column', gap: '6px' },
    mobileFilterItemFull: { display: 'flex', flexDirection: 'column', gap: '6px', gridColumn: '1 / -1' },
    grid: { display: 'grid', gap: '20px' },
    card: { cursor: 'pointer', backgroundColor: 'transparent', display: 'flex', flexDirection: 'column', gap: '8px' },
    imageWrapper: { width: '100%', paddingTop: '100%', position: 'relative', overflow: 'hidden', borderRadius: '0', backgroundColor: '#fff', boxShadow: '0 5px 15px rgba(0,0,0,0.05)', transition: 'transform 0.3s ease' },
    image: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', transition: 'all 0.5s ease' },
    viewBtn: { backgroundColor: 'var(--color-white)', color: 'var(--color-dark-brown)', padding: '10px 20px', fontSize: '0.85rem', fontWeight: '600', border: 'none', borderRadius: '30px', boxShadow: '0 4px 15px rgba(0,0,0,0.2)', cursor: 'pointer', width: '140px', transition: 'all 0.3s ease' },
    productName: { fontFamily: 'var(--font-body-inter)', fontSize: '0.9rem', color: 'var(--color-dark-brown)', fontWeight: '500', margin: 0 },
    productPrice: { fontFamily: 'var(--font-body-inter)', fontSize: '0.85rem', color: 'var(--color-dark-brown)', fontWeight: '700', margin: 0 },
    productDesc: { fontFamily: 'var(--font-body-inter)', fontSize: '0.8rem', color: '#888', margin: 0, lineHeight: '1.3' },
    noResults: { textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: '1.2rem', marginTop: '60px' },
    pagination: { display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '60px', gap: '10px' },
    paginationArrow: { background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-dark-brown)', fontSize: '1rem', display: 'flex', alignItems: 'center', padding: '0 10px' },
};

// Inject hover styles
const styleSheet = document.createElement("style");
styleSheet.innerText = `
    .image-wrapper:hover .product-image { transform: scale(1.1); filter: blur(4px); }
    .image-wrapper:hover .overlay { opacity: 1; }
    .overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(62,39,35,0.4); backdrop-filter: blur(2px); display: flex; flex-direction: column; gap: 10px; align-items: center; justify-content: center; opacity: 0; transition: all 0.3s ease; }
    .action-btn { transform: translateY(20px); opacity: 0; transition: all 0.3s ease; }
    .image-wrapper:hover .action-btn { transform: translateY(0); opacity: 1; }
    @media (max-width: 1024px) { .grid { grid-template-columns: repeat(2, 1fr) !important; } }
    @media (max-width: 768px) {
        .contentWrapper { flex-direction: column !important; gap: 20px !important; width: 100% !important; }
        .contentWrapper aside { position: static !important; flex: unset !important; width: 100% !important; }
        .contentWrapper main { width: 100% !important; flex: unset !important; }
        .grid { grid-template-columns: repeat(2, 1fr) !important; gap: 10px !important; width: 100% !important; }
        .products-container { padding: 30px 10px !important; }
        .product-card { width: 100% !important; }
    }
    @media (max-width: 480px) {
        .grid { grid-template-columns: repeat(2, 1fr) !important; gap: 8px !important; }
        .products-container { padding: 20px 8px !important; }
    }
`;
document.head.appendChild(styleSheet);

export default Products;
