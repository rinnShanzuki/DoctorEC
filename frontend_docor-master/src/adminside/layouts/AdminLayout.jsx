import React, { useState, useEffect } from 'react';
import { FaCog, FaChevronDown, FaChevronRight } from 'react-icons/fa';
import NotificationBell from '../components/NotificationBell';
import {
    MdDashboard,
    MdEventNote,
    MdPeople,
    MdLocalHospital,
    MdInventory2,
    MdMedicalServices,
    MdAssessment,
    MdPointOfSale,
    MdDirectionsWalk,
    MdPersonAdd,
    MdGroups,
    MdCategory,
    MdBarChart,
    MdOutlineSchedule,
    MdOutlineComputer
} from 'react-icons/md';
import { Outlet, Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { prefetchAll } from '../../services/apiCache';
import logo from '../../assets/logo.jpg';
import './AdminLayout.css';

const AdminLayout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [isSidebarHidden, setIsSidebarHidden] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [showCashierModal, setShowCashierModal] = useState(false);
    const [showSettingsMenu, setShowSettingsMenu] = useState(false);

    // Collapsible section states
    const [expandedSections, setExpandedSections] = useState({});

    // Prefetch common data on mount so all admin pages load instantly
    useEffect(() => {
        prefetchAll([
            '/doctors',
            '/products',
            '/services',
            '/appointments',
            '/patients',
            '/clients',
            '/customers',
            '/dashboard/all',
            '/inventory/analytics',
            '/services/with-stats',
            '/sales/transactions',
        ]);
    }, []);

    const toggleSection = (section) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const handleLogoutClick = () => {
        setShowLogoutModal(true);
    };

    const handleCashierClick = () => {
        setShowCashierModal(true);
    };

    const confirmLogout = () => {
        logout();
        setShowLogoutModal(false);
        navigate('/login');
    };

    const performLogout = () => {
        logout();
        setShowLogoutModal(false);
        navigate('/login');
    };

    // Check if user is Staff role
    const isStaff = user?.role_id === 3 || user?.role_name === 'Staff';

    const confirmCashierSwitch = () => {
        navigate('/cashier');
        setShowCashierModal(false);
    };

    const cancelLogout = () => {
        setShowLogoutModal(false);
    };

    const cancelCashierSwitch = () => {
        setShowCashierModal(false);
    };

    // Helper to check if a path is active (for parent highlighting)
    const isPathActive = (paths) => {
        return paths.some(p => location.pathname === p || location.pathname.startsWith(p + '/'));
    };

    return (
        <div className="admin-container">
            {/* Sidebar */}
            <aside className={`admin-sidebar ${isSidebarHidden ? 'hidden' : ''}`}>
                <div className="sidebar-header">
                    <div className="brand-container">
                        <div className="admin-logo">
                            <img src={logo} alt="Doctor EC Logo" className="logo-image" />
                        </div>
                        <h2>Doctor EC Optical Clinic</h2>
                    </div>
                </div>
                <nav className="sidebar-nav">
                    {/* Admin Only - Full Access (role_id=1) */}
                    {(user?.role_id === 1 || user?.role_name === 'Admin' || (!user?.role_id && !user?.role_name)) && (
                        <>
                            {/* Dashboard */}
                            <NavLink to="/admin/dashboard" end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                                <MdDashboard className="nav-icon" />
                                <span>Dashboard</span>
                            </NavLink>

                            {/* Appointments - Collapsible */}
                            <div className={`nav-section ${isPathActive(['/admin/dashboard/walk-in-appointments', '/admin/dashboard/online-appointments', '/admin/dashboard/appointments']) ? 'section-active' : ''}`}>
                                <button className="nav-section-toggle" onClick={() => toggleSection('appointments')}>
                                    <div className="nav-section-label">
                                        <MdEventNote className="nav-icon" />
                                        <span>Appointments</span>
                                    </div>
                                    {expandedSections.appointments ? <FaChevronDown className="chevron-icon" /> : <FaChevronRight className="chevron-icon" />}
                                </button>
                                <div className={`nav-section-children ${expandedSections.appointments ? 'expanded' : ''}`}>
                                    <NavLink to="/admin/dashboard/walk-in-appointments" className={({ isActive }) => `nav-sub-item ${isActive ? 'active' : ''}`}>
                                        <MdOutlineSchedule className="nav-sub-icon" />
                                        Walk-In Appointment
                                    </NavLink>
                                    <NavLink to="/admin/dashboard/online-appointments" className={({ isActive }) => `nav-sub-item ${isActive ? 'active' : ''}`}>
                                        <MdOutlineComputer className="nav-sub-icon" />
                                        Online Appointment
                                    </NavLink>
                                </div>
                            </div>

                            {/* Patients & Clients - Collapsible */}
                            <div className={`nav-section ${isPathActive(['/admin/dashboard/walk-in-patients', '/admin/dashboard/users', '/admin/dashboard/customers', '/admin/dashboard/clients/', '/admin/dashboard/customer-details/', '/admin/dashboard/patients/']) ? 'section-active' : ''}`}>
                                <button className="nav-section-toggle" onClick={() => toggleSection('patients')}>
                                    <div className="nav-section-label">
                                        <MdPeople className="nav-icon" />
                                        <span>Patients & Clients</span>
                                    </div>
                                    {expandedSections.patients ? <FaChevronDown className="chevron-icon" /> : <FaChevronRight className="chevron-icon" />}
                                </button>
                                <div className={`nav-section-children ${expandedSections.patients ? 'expanded' : ''}`}>
                                    <NavLink to="/admin/dashboard/walk-in-patients" className={({ isActive }) => `nav-sub-item ${isActive ? 'active' : ''}`}>
                                        <MdDirectionsWalk className="nav-sub-icon" />
                                        Walk-In Patients
                                    </NavLink>
                                    <NavLink to="/admin/dashboard/users" className={({ isActive }) => `nav-sub-item ${isActive ? 'active' : ''}`}>
                                        <MdPersonAdd className="nav-sub-icon" />
                                        Online Registered Clients
                                    </NavLink>
                                    <NavLink to="/admin/dashboard/customers" className={({ isActive }) => `nav-sub-item ${isActive ? 'active' : ''}`}>
                                        <MdGroups className="nav-sub-icon" />
                                        Customers
                                    </NavLink>
                                </div>
                            </div>

                            {/* Doctors */}
                            <NavLink to="/admin/dashboard/optometrist" className={({ isActive }) => `nav-item ${isActive || window.location.pathname.startsWith('/admin/dashboard/doctor/') ? 'active' : ''}`}>
                                <MdLocalHospital className="nav-icon" />
                                <span>Doctors</span>
                            </NavLink>

                            {/* Products & Inventory - Collapsible */}
                            <div className={`nav-section ${isPathActive(['/admin/dashboard/products', '/admin/dashboard/inventory']) ? 'section-active' : ''}`}>
                                <button className="nav-section-toggle" onClick={() => toggleSection('products')}>
                                    <div className="nav-section-label">
                                        <MdInventory2 className="nav-icon" />
                                        <span>Products & Inventory</span>
                                    </div>
                                    {expandedSections.products ? <FaChevronDown className="chevron-icon" /> : <FaChevronRight className="chevron-icon" />}
                                </button>
                                <div className={`nav-section-children ${expandedSections.products ? 'expanded' : ''}`}>
                                    <NavLink to="/admin/dashboard/products" className={({ isActive }) => `nav-sub-item ${isActive ? 'active' : ''}`}>
                                        <MdCategory className="nav-sub-icon" />
                                        Product Management
                                    </NavLink>
                                    <NavLink to="/admin/dashboard/inventory" className={({ isActive }) => `nav-sub-item ${isActive ? 'active' : ''}`}>
                                        <MdBarChart className="nav-sub-icon" />
                                        Inventory Dashboard
                                    </NavLink>
                                </div>
                            </div>

                            {/* Services */}
                            <NavLink to="/admin/dashboard/services" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                                <MdMedicalServices className="nav-icon" />
                                <span>Services</span>
                            </NavLink>

                            {/* Reports & Analytics */}
                            <NavLink to="/admin/dashboard/reports" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                                <MdAssessment className="nav-icon" />
                                <span>Reports & Analytics</span>
                            </NavLink>

                            {/* POS */}
                            <NavLink to="/cashier" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                                <MdPointOfSale className="nav-icon" />
                                <span>POS</span>
                            </NavLink>
                        </>
                    )}

                    {/* Staff Only - Limited Access (role_id=3) */}
                    {isStaff && (
                        <>
                            <NavLink to="/admin/dashboard/appointments" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                                <MdEventNote className="nav-icon" />
                                <span>Appointments</span>
                            </NavLink>
                            <NavLink to="/admin/dashboard/products" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                                <MdInventory2 className="nav-icon" />
                                <span>Products</span>
                            </NavLink>
                        </>
                    )}

                    {/* Cashier Only - CashierPOS only (role_id=2) */}
                    {(user?.role_id === 2 || user?.role_name === 'Cashier') && (
                        <NavLink to="/cashier" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                            <MdPointOfSale className="nav-icon" />
                            <span>Cashier POS</span>
                        </NavLink>
                    )}
                </nav>
            </aside>

            {/* Main Content */}
            <div className={`admin-main ${isSidebarHidden ? 'full-width' : ''}`}>
                {/* Top Navbar */}
                <header className="admin-navbar">
                    <div className="navbar-left">
                        <button
                            className="sidebar-toggle"
                            onClick={() => setIsSidebarHidden(!isSidebarHidden)}
                        >
                            ☰
                        </button>
                        <h1 className="page-title">{isStaff ? 'Staff Dashboard' : 'Admin Dashboard'}</h1>
                    </div>
                    <div className="navbar-right">
                        {/* Staff: Simple logout only */}
                        {isStaff ? (
                            <button
                                onClick={handleLogoutClick}
                                style={{
                                    background: 'rgba(255,255,255,0.2)',
                                    border: 'none',
                                    color: 'white',
                                    padding: '8px 20px',
                                    borderRadius: '20px',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    fontWeight: 'bold'
                                }}
                            >
                                Logout
                            </button>
                        ) : (
                            /* Admin: Full navbar with settings and profile */
                            <>
                                {/* Low Stock Notification Bell */}
                                <NotificationBell />

                                {/* Settings Gear Dropdown */}
                                <div className="settings-section">
                                    <button
                                        onClick={() => {
                                            setShowSettingsMenu(!showSettingsMenu);
                                            setShowProfileMenu(false);
                                        }}
                                        className={`settings-gear-btn ${showSettingsMenu ? 'active' : ''}`}
                                        title="Settings"
                                    >
                                        <FaCog />
                                    </button>

                                    {showSettingsMenu && (
                                        <div className="settings-dropdown">
                                            <div className="dropdown-header">
                                                <p className="dropdown-name">Settings</p>
                                            </div>
                                            <button className="dropdown-item" onClick={() => { navigate('/admin/dashboard/history'); setShowSettingsMenu(false); }}>
                                                Staff Management
                                            </button>

                                            <button className="dropdown-item" onClick={() => { navigate('/admin/dashboard/profile'); setShowSettingsMenu(false); }}>
                                                Profile Settings
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Profile Section */}
                                <div className="profile-section">
                                    <button
                                        className="profile-button"
                                        onClick={() => {
                                            setShowProfileMenu(!showProfileMenu);
                                            setShowSettingsMenu(false);
                                        }}
                                    >
                                        <div className="profile-icon">
                                            {user?.name?.charAt(0).toUpperCase() || 'A'}
                                        </div>
                                        <span className="profile-name">{user?.name}</span>
                                        <span className="dropdown-arrow">▼</span>
                                    </button>

                                    {showProfileMenu && (
                                        <div className="profile-dropdown">
                                            <div className="dropdown-header">
                                                <p className="dropdown-name">{user?.name}</p>
                                                <p className="dropdown-email">{user?.email}</p>
                                            </div>
                                            <button className="dropdown-item tooltip-container" onClick={() => { navigate('/admin/dashboard/client-view'); setShowProfileMenu(false); }}>
                                                View Client Site
                                                <span className="tooltip-text">View the website in admin-view</span>
                                            </button>
                                            <button className="dropdown-item logout" onClick={handleLogoutClick}>
                                                Logout
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </header>

                {/* Page Content */}
                <main className="admin-content">
                    <Outlet />
                </main>

                {/* Logout Confirmation Modal */}
                {showLogoutModal && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <h3>Confirm Logout</h3>
                            <p>Are you sure you want to log out?</p>
                            <div className="modal-actions">
                                <button className="modal-btn cancel" onClick={cancelLogout}>Cancel</button>
                                <button className="modal-btn confirm" onClick={performLogout}>Log Out</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Cashier Switch Confirmation Modal */}
                {showCashierModal && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <h3 style={{ color: '#5D4E37' }}>Switch to Cashier?</h3>
                            <p>Are you sure you want to switch to the Cashier role?</p>
                            <div className="modal-actions">
                                <button className="modal-btn cancel" onClick={cancelCashierSwitch}>Cancel</button>
                                <button className="modal-btn confirm" onClick={confirmCashierSwitch} style={{ backgroundColor: '#5D4E37' }}>Switch</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminLayout;
