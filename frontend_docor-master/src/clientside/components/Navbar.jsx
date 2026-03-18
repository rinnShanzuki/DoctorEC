import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { FaSearch, FaBars, FaTimes } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { useSiteSettings } from '../context/SiteSettingsContext';
import logo from '../../assets/logo.jpg';

const Navbar = () => {
    const { user, logout, isAdmin } = useAuth();
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const navigate = useNavigate();
    const { getSetting } = useSiteSettings();
    const clinicName = getSetting('clinic_name', 'Doctor EC Optical Clinic');

    const handleSearchToggle = () => {
        setIsSearchOpen(!isSearchOpen);
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
            setIsSearchOpen(false);
            setSearchQuery('');
        }
    };

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    const handleLogoutClick = () => {
        setShowProfileDropdown(false);
        setShowLogoutModal(true);
    };

    const handleLogoutConfirm = async () => {
        try {
            setShowLogoutModal(false);
            setShowProfileDropdown(false);
            setIsMobileMenuOpen(false);
            await logout();
            navigate('/');
        } catch (error) {
            console.error('Logout failed:', error);
            navigate('/');
        }
    };

    const handleLogoutCancel = () => {
        setShowLogoutModal(false);
    };

    const handleMobileNavClick = () => {
        setIsMobileMenuOpen(false);
        scrollToTop();
    };

    const navLinks = [
        { to: '/', label: 'Home', end: true },
        { to: user ? '/client-services' : '/services', label: 'Services' },
        { to: user ? '/client-products' : '/products', label: 'Products' },

        { to: user ? '/client-about' : '/about', label: 'About Us' },
    ];

    return (
        <nav style={styles.navbar}>
            <div className="container" style={styles.container}>
                <div style={styles.logoSection} onClick={scrollToTop}>
                    <NavLink to="/" style={styles.logoLink}>
                        <img src={logo} alt="Doctor EC Optical Clinic Logo" className="navbar-logo-image" style={styles.logoImage} />
                        <span className="navbar-brand-name" style={styles.brandName}>{clinicName}</span>
                    </NavLink>
                </div>

                {/* Desktop Nav Links */}
                <div className="navbar-links" style={styles.navLinks}>
                    {navLinks.map(link => (
                        <NavLink
                            key={link.to}
                            to={link.to}
                            style={({ isActive }) => isActive ? { ...styles.link, ...styles.activeLink } : styles.link}
                            onClick={scrollToTop}
                            end={link.end}
                        >
                            {link.label}
                        </NavLink>
                    ))}
                </div>

                <div style={styles.icons}>
                    <div style={styles.searchContainer}>
                        {isSearchOpen && (
                            <form onSubmit={handleSearchSubmit} style={styles.searchForm}>
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    style={styles.searchInput}
                                />
                            </form>
                        )}
                        <button
                            style={styles.iconBtn}
                            aria-label="Search"
                            onClick={handleSearchToggle}
                        >
                            <FaSearch />
                        </button>
                    </div>

                    {/* Conditional Auth Section (desktop) */}
                    {user ? (
                        <div style={styles.profileSection}>
                            <button
                                style={styles.profileButton}
                                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                            >
                                <div style={styles.profileIcon}>
                                    {user.name?.charAt(0).toUpperCase() || 'U'}
                                </div>
                            </button>

                            {showProfileDropdown && (
                                <div style={styles.profileDropdown}>
                                    <div style={styles.dropdownHeader}>
                                        <p style={styles.dropdownName}>{user.name}</p>
                                        <p style={styles.dropdownEmail}>{user.email}</p>
                                    </div>
                                    <div style={styles.dropdownDivider}></div>
                                    {isAdmin() && (
                                        <>
                                            <button
                                                style={styles.dropdownItem}
                                                onClick={() => {
                                                    navigate('/admin/dashboard');
                                                    setShowProfileDropdown(false);
                                                }}
                                            >
                                                <span style={styles.dropdownIcon}>📊</span>
                                                Admin Dashboard
                                            </button>
                                            <div style={styles.dropdownDivider}></div>
                                        </>
                                    )}
                                    <button
                                        style={styles.dropdownItem}
                                        onClick={() => {
                                            navigate('/client-my-appointments');
                                            setShowProfileDropdown(false);
                                        }}
                                    >
                                        My Appointments
                                    </button>

                                    <div style={styles.dropdownDivider}></div>
                                    <button
                                        style={{ ...styles.dropdownItem, ...styles.logoutItem }}
                                        onClick={handleLogoutClick}
                                    >
                                        Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="navbar-auth-buttons" style={styles.authButtons}>
                            <button
                                style={styles.loginBtn}
                                onClick={() => navigate('/login')}
                            >
                                Login
                            </button>
                            <button
                                style={styles.signUpBtn}
                                onClick={() => navigate('/signup')}
                            >
                                Sign Up
                            </button>
                        </div>
                    )}

                    {/* Hamburger Button (mobile only, shown via CSS) */}
                    <button
                        className="navbar-hamburger"
                        onClick={() => setIsMobileMenuOpen(true)}
                        aria-label="Open menu"
                    >
                        <FaBars />
                    </button>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            <div
                className={`navbar-overlay ${isMobileMenuOpen ? 'open' : ''}`}
                onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Mobile Menu Panel */}
            <div className={`navbar-mobile-menu ${isMobileMenuOpen ? 'open' : ''}`}>
                <button
                    className="navbar-mobile-close"
                    onClick={() => setIsMobileMenuOpen(false)}
                    aria-label="Close menu"
                >
                    <FaTimes />
                </button>

                {navLinks.map(link => (
                    <NavLink
                        key={link.to}
                        to={link.to}
                        className={({ isActive }) => isActive ? 'active' : ''}
                        onClick={handleMobileNavClick}
                        end={link.end}
                    >
                        {link.label}
                    </NavLink>
                ))}

                {user ? (
                    <div className="mobile-auth-buttons">
                        <div style={{ padding: '12px 16px', color: 'var(--color-cream-white)', fontSize: '0.9rem', opacity: 0.8 }}>
                            Signed in as <strong>{user.name}</strong>
                        </div>
                        {isAdmin() && (
                            <button
                                className="mobile-login-btn"
                                onClick={() => { navigate('/admin/dashboard'); setIsMobileMenuOpen(false); }}
                            >
                                📊 Admin Dashboard
                            </button>
                        )}
                        <button
                            className="mobile-login-btn"
                            onClick={() => { navigate('/client-my-appointments'); setIsMobileMenuOpen(false); }}
                        >
                            My Appointments
                        </button>
                        <button
                            className="mobile-signup-btn"
                            style={{ color: '#D32F2F', backgroundColor: 'rgba(211, 47, 47, 0.1)', border: '1px solid #D32F2F' }}
                            onClick={() => { handleLogoutClick(); setIsMobileMenuOpen(false); }}
                        >
                            Logout
                        </button>
                    </div>
                ) : (
                    <div className="mobile-auth-buttons">
                        <button
                            className="mobile-login-btn"
                            onClick={() => { navigate('/login'); setIsMobileMenuOpen(false); }}
                        >
                            Login
                        </button>
                        <button
                            className="mobile-signup-btn"
                            onClick={() => { navigate('/signup'); setIsMobileMenuOpen(false); }}
                        >
                            Sign Up
                        </button>
                    </div>
                )}
            </div>

            {/* Logout Confirmation Modal */}
            {showLogoutModal && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalContent}>
                        <h3 style={styles.modalTitle}>Confirm Logout</h3>
                        <p style={styles.modalMessage}>Are you sure you want to log out?</p>
                        <div style={styles.modalButtons}>
                            <button
                                style={styles.cancelButton}
                                onClick={handleLogoutCancel}
                            >
                                Cancel
                            </button>
                            <button
                                style={styles.confirmButton}
                                onClick={handleLogoutConfirm}
                            >
                                OK
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <style>
                {`
                    .nav-link:hover {
                        color: #f2b360c6 !important;
                    }
                    @keyframes slideDown {
                        from {
                            opacity: 0;
                            transform: translateY(-10px);
                        }
                        to {
                            opacity: 1;
                            transform: translateY(0);
                        }
                    }
                `}
            </style>
        </nav>
    );
};

const styles = {
    navbar: {
        backgroundColor: 'var(--color-dark-brown)',
        height: '80px',
        display: 'flex',
        alignItems: 'center',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        width: '100%',
    },
    container: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        maxWidth: 'var(--max-width)',
        margin: '0 auto',
        padding: '0 20px',
    },
    logoSection: {
        display: 'flex',
        alignItems: 'center',
        cursor: 'pointer',
        flex: '1',
    },
    logoLink: {
        display: 'flex',
        alignItems: 'center',
        textDecoration: 'none',
        gap: '10px',
    },
    logoImage: {
        width: '45px',
        height: '45px',
        objectFit: 'contain',
        borderRadius: '50%',
        border: '2px solid var(--color-cream-white)',
    },
    brandName: {
        fontFamily: 'var(--font-heading-poppins)',
        fontWeight: '700',
        fontSize: '1.3rem',
        color: 'var(--color-cream-white)',
        whiteSpace: 'nowrap',
    },
    navLinks: {
        display: 'flex',
        gap: '25px',
        alignItems: 'center',
        justifyContent: 'center',
        flex: '2',
    },
    link: {
        textDecoration: 'none',
        color: 'var(--color-cream-white)',
        fontFamily: 'var(--font-body-inter)',
        fontWeight: '500',
        fontSize: '0.95rem',
        transition: 'color 0.3s ease',
        padding: '8px 0',
        position: 'relative',
    },
    activeLink: {
        color: '#f2b360c6',
        fontWeight: '700',
    },
    icons: {
        display: 'flex',
        gap: '15px',
        alignItems: 'center',
        justifyContent: 'flex-end',
        flex: '1',
    },
    iconBtn: {
        background: 'none',
        border: 'none',
        color: 'var(--color-cream-white)',
        fontSize: '1.2rem',
        cursor: 'pointer',
        padding: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'transform 0.2s ease',
    },
    searchContainer: {
        display: 'flex',
        alignItems: 'center',
    },
    searchForm: {
        marginRight: '5px',
    },
    searchInput: {
        padding: '6px 12px',
        borderRadius: '20px',
        border: '1px solid var(--color-cream-white)',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        color: 'var(--color-cream-white)',
        fontFamily: 'var(--font-body-inter)',
        fontSize: '0.9rem',
        outline: 'none',
    },
    profileSection: {
        position: 'relative',
    },
    profileButton: {
        background: 'none',
        border: '2px solid var(--color-cream-white)',
        padding: '4px',
        borderRadius: '50%',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    profileIcon: {
        width: '36px',
        height: '36px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #f2b360 0%, #d4a857 100%)',
        color: '#5D4E37',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: '700',
        fontSize: '1rem',
        fontFamily: 'var(--font-body-inter)',
    },
    profileDropdown: {
        position: 'absolute',
        top: 'calc(100% + 12px)',
        right: '0',
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
        minWidth: '240px',
        zIndex: 2000,
        overflow: 'hidden',
        animation: 'slideDown 0.2s ease',
    },
    dropdownHeader: {
        padding: '16px',
        backgroundColor: '#F5F1EE',
        borderBottom: '1px solid #E0D5C7',
    },
    dropdownName: {
        fontFamily: 'var(--font-body-inter)',
        fontWeight: '700',
        color: '#5D4E37',
        margin: '0 0 4px 0',
        fontSize: '0.95rem',
    },
    dropdownEmail: {
        fontFamily: 'var(--font-body-inter)',
        color: '#8B7355',
        margin: '0',
        fontSize: '0.85rem',
    },
    dropdownDivider: {
        height: '1px',
        backgroundColor: '#E0D5C7',
    },
    dropdownItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        width: '100%',
        padding: '12px 16px',
        background: 'none',
        border: 'none',
        textAlign: 'left',
        fontFamily: 'var(--font-body-inter)',
        fontSize: '0.9rem',
        color: '#5D4E37',
        cursor: 'pointer',
        transition: 'background-color 0.15s ease',
    },
    dropdownIcon: {
        fontSize: '1.1rem',
    },
    logoutItem: {
        color: '#D32F2F',
    },
    authButtons: {
        display: 'flex',
        gap: '10px',
        alignItems: 'center',
    },
    loginBtn: {
        backgroundColor: 'transparent',
        color: 'var(--color-cream-white)',
        border: '1px solid var(--color-cream-white)',
        padding: '8px 20px',
        borderRadius: '20px',
        cursor: 'pointer',
        fontFamily: 'var(--font-body-inter)',
        fontWeight: '500',
        transition: 'all 0.3s ease',
    },
    signUpBtn: {
        backgroundColor: 'var(--color-cream-white)',
        color: 'var(--color-dark-brown)',
        border: 'none',
        padding: '8px 20px',
        borderRadius: '20px',
        cursor: 'pointer',
        fontFamily: 'var(--font-body-inter)',
        fontWeight: '600',
        transition: 'all 0.3s ease',
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
        zIndex: 10000,
    },
    modalContent: {
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
        maxWidth: '400px',
        width: '90%',
        textAlign: 'center',
    },
    modalTitle: {
        fontSize: '1.5rem',
        fontWeight: '600',
        color: 'var(--color-dark-brown)',
        marginBottom: '15px',
        fontFamily: 'var(--font-heading-playfair)',
    },
    modalMessage: {
        fontSize: '1rem',
        color: '#666',
        marginBottom: '25px',
        fontFamily: 'var(--font-body-inter)',
    },
    modalButtons: {
        display: 'flex',
        gap: '15px',
        justifyContent: 'center',
    },
    cancelButton: {
        backgroundColor: '#f0f0f0',
        color: '#333',
        border: 'none',
        padding: '10px 30px',
        borderRadius: '6px',
        cursor: 'pointer',
        fontFamily: 'var(--font-body-inter)',
        fontWeight: '500',
        fontSize: '1rem',
        transition: 'all 0.3s ease',
    },
    confirmButton: {
        backgroundColor: 'var(--color-dark-brown)',
        color: 'white',
        border: 'none',
        padding: '10px 30px',
        borderRadius: '6px',
        cursor: 'pointer',
        fontFamily: 'var(--font-body-inter)',
        fontWeight: '600',
        fontSize: '1rem',
        transition: 'all 0.3s ease',
    }
};

export default Navbar;
