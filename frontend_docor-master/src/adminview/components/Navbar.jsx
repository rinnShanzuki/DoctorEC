import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { FaSearch } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { useModal } from '../../context/ModalContext';
import logo from '../../assets/logo.jpg';

const Navbar = ({ basePath = "" }) => {
    const { user, logout, isAdmin } = useAuth();
    const { openSignIn, openSignUp } = useModal();
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);
    const navigate = useNavigate();

    const handleSearchToggle = () => {
        setIsSearchOpen(!isSearchOpen);
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            console.log('Searching for:', searchQuery);
        }
    };

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    const handleLogout = async () => {
        await logout();
        setShowProfileDropdown(false);
        navigate('/');
    };

    // Helper to determine destination
    const getLink = (path) => `${basePath}${path}`;

    return (
        <nav style={styles.navbar}>
            <div className="container" style={styles.container}>
                <div style={styles.logoSection} onClick={scrollToTop}>
                    <NavLink to={getLink("/")} style={styles.logoLink}>
                        <img src={logo} alt="Doctor EC Optical Clinic Logo" style={styles.logoImage} />
                        <span style={styles.brandName}>Doctor EC Optical Clinic</span>
                    </NavLink>
                </div>

                <div style={styles.navLinks}>
                    <NavLink
                        to={getLink("/")}
                        style={({ isActive }) => isActive ? { ...styles.link, ...styles.activeLink } : styles.link}
                        onClick={scrollToTop}
                        end
                    >
                        Home
                    </NavLink>
                    <NavLink
                        to={getLink("/appointments")}
                        style={({ isActive }) => isActive ? { ...styles.link, ...styles.activeLink } : styles.link}
                        onClick={scrollToTop}
                    >
                        Appointments
                    </NavLink>
                    <NavLink
                        to={getLink("/products")}
                        style={({ isActive }) => isActive ? { ...styles.link, ...styles.activeLink } : styles.link}
                        onClick={scrollToTop}
                    >
                        Products
                    </NavLink>

                    <NavLink
                        to={getLink("/about")}
                        style={({ isActive }) => isActive ? { ...styles.link, ...styles.activeLink } : styles.link}
                        onClick={scrollToTop}
                    >
                        About Us
                    </NavLink>
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
                                                    navigate('/admin');
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
                                            navigate(getLink('/appointments'));
                                            setShowProfileDropdown(false);
                                        }}
                                    >
                                        <span style={styles.dropdownIcon}>📅</span>
                                        My Appointments
                                    </button>
                                    <button
                                        style={styles.dropdownItem}
                                        onClick={() => {
                                            navigate(getLink('/products')); // Assuming reservations are on products page or separate
                                            setShowProfileDropdown(false);
                                        }}
                                    >
                                        <span style={styles.dropdownIcon}>🛒</span>
                                        My Reservations
                                    </button>
                                    <div style={styles.dropdownDivider}></div>
                                    <button
                                        style={{ ...styles.dropdownItem, ...styles.logoutItem }}
                                        onClick={handleLogout}
                                    >
                                        <span style={styles.dropdownIcon}>🚪</span>
                                        Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div style={{ display: 'flex', gap: '10px' }}>
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
                </div>
            </div>
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
        color: '#c62828',
    },
    loginBtn: {
        backgroundColor: 'transparent',
        color: 'var(--color-cream-white)',
        border: '2px solid var(--color-cream-white)',
        padding: '8px 20px',
        borderRadius: '20px',
        fontFamily: 'var(--font-body-inter)',
        fontSize: '0.95rem',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
    },
    signUpBtn: {
        backgroundColor: 'var(--color-cream-white)',
        color: 'var(--color-dark-brown)',
        border: 'none',
        padding: '8px 20px',
        borderRadius: '20px',
        fontFamily: 'var(--font-body-inter)',
        fontSize: '0.95rem',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
    },
};

export default Navbar;
