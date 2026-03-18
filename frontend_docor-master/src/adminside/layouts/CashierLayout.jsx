import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { adminAPI } from '../../services/api';
import adminAuthService from '../../services/adminAuthService';
import './AdminLayout.css'; // Reuse admin styles for consistency

import logo from '../../assets/logo.jpg';

const CashierLayout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [gcashQrUrl, setGcashQrUrl] = useState(null);
    const [qrPreview, setQrPreview] = useState(null);
    const [qrLoading, setQrLoading] = useState(false);
    const [qrSaving, setQrSaving] = useState(false);

    // Determine active tab from URL
    const activeTab = location.pathname.includes('/cashier/history') ? 'history' : 'pos';

    // Check if the current user is an admin (role_id=1)
    const storedAdmin = adminAuthService.getStoredAdmin();
    const isAdmin = storedAdmin?.role_id === 1;

    // Load GCash QR from database on mount
    useEffect(() => {
        fetchGcashQr();
    }, []);

    const fetchGcashQr = async () => {
        try {
            setQrLoading(true);
            const response = await adminAPI.getGcashQr();
            const data = response.data?.data;
            if (data?.qr_img) {
                setGcashQrUrl(data.qr_img);
                setQrPreview(data.qr_img);
            }
        } catch (error) {
            console.error('Error fetching GCash QR:', error);
        } finally {
            setQrLoading(false);
        }
    };

    const saveGcashQr = async (base64Image) => {
        try {
            setQrSaving(true);
            await adminAPI.saveGcashQr({ qr_img: base64Image });
            setGcashQrUrl(base64Image);
            setQrPreview(base64Image);
        } catch (error) {
            console.error('Error saving GCash QR:', error);
            alert('Failed to save QR code');
        } finally {
            setQrSaving(false);
        }
    };

    const handleLogoutClick = () => {
        setShowLogoutModal(true);
    };

    const confirmLogout = () => {
        logout();
        setShowLogoutModal(false);
        navigate(isAdmin ? '/admin/dashboard' : '/login');
    };

    const cancelLogout = () => {
        setShowLogoutModal(false);
    };

    return (
        <div className="admin-container" style={{ flexDirection: 'column' }}>
            {/* Top Navbar for Cashier */}
            <header className="admin-navbar" style={{ width: '100%', left: 0, padding: '0 30px', backgroundColor: '#8B7154', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {/* Left - Logo & Back Button */}
                <div className="navbar-left" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    {isAdmin && (
                        <button
                            onClick={() => navigate('/admin/dashboard')}
                            title="Back to Admin Dashboard"
                            style={{
                                background: 'rgba(255,255,255,0.2)',
                                border: 'none',
                                color: 'white',
                                padding: '8px 16px',
                                borderRadius: '20px',
                                cursor: 'pointer',
                                fontSize: '13px',
                                fontWeight: 'bold',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                transition: 'background 0.3s'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
                            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                        >
                            ← Dashboard
                        </button>
                    )}
                    <div className="logo-text" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <img src={logo} alt="Doctor EC Logo" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '2px solid white' }} />
                        <h2 style={{ color: 'white', margin: 0, fontSize: '1.2rem' }}>Doctor EC Optical Clinic</h2>
                    </div>
                </div>

                {/* Center - Title */}
                <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
                    <h1 style={{
                        color: 'white',
                        margin: 0,
                        fontSize: '1.5rem',
                        fontWeight: '600',
                        letterSpacing: '1px'
                    }}>
                        Cashier
                    </h1>
                </div>

                {/* Right - Tabs and Icons */}
                <div className="navbar-right" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    {/* POS and History Tabs */}
                    <div style={{ display: 'flex', gap: '5px' }}>
                        <Link
                            to="/cashier"
                            style={{
                                padding: '8px 20px',
                                borderRadius: '20px',
                                background: activeTab === 'pos' ? 'white' : 'rgba(255,255,255,0.2)',
                                color: activeTab === 'pos' ? '#5D4E37' : 'white',
                                textDecoration: 'none',
                                fontWeight: 'bold',
                                fontSize: '13px',
                                transition: 'all 0.3s'
                            }}
                        >
                            POS
                        </Link>
                        <Link
                            to="/cashier/history"
                            style={{
                                padding: '8px 20px',
                                borderRadius: '20px',
                                background: activeTab === 'history' ? 'white' : 'rgba(255,255,255,0.2)',
                                color: activeTab === 'history' ? '#5D4E37' : 'white',
                                textDecoration: 'none',
                                fontWeight: 'bold',
                                fontSize: '13px',
                                transition: 'all 0.3s'
                            }}
                        >
                            History
                        </Link>
                    </div>

                    <div className="admin-profile">
                        <div className="profile-info" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            {/* Settings Button - Icon Only */}
                            <button
                                onClick={() => setShowSettings(true)}
                                title="Settings"
                                style={{
                                    background: 'rgba(255,255,255,0.2)',
                                    border: 'none',
                                    color: 'white',
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '50%',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'background 0.3s'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
                                onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="3"></circle>
                                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                                </svg>
                            </button>

                            {/* Logout Button - Icon Only */}
                            <button
                                onClick={handleLogoutClick}
                                title="Logout"
                                style={{
                                    background: 'rgba(255,255,255,0.2)',
                                    border: 'none',
                                    color: 'white',
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '50%',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'background 0.3s'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(198,40,40,0.8)'}
                                onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                                    <polyline points="16 17 21 12 16 7"></polyline>
                                    <line x1="21" y1="12" x2="9" y2="12"></line>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main style={{
                flex: 1,
                backgroundColor: '#F5F1EE',
                padding: '20px',
                marginTop: '60px', // Height of navbar
                overflowY: 'auto'
            }}>
                <Outlet />
            </main>

            {/* Settings Modal */}
            {showSettings && (
                <div className="modal-overlay" onClick={() => setShowSettings(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h2 style={{ margin: 0, color: '#5D4E37' }}>⚙️ POS Settings</h2>
                            <button
                                onClick={() => setShowSettings(false)}
                                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}
                            >✕</button>
                        </div>

                        {/* GCash QR Code Upload */}
                        <div style={{
                            padding: '20px',
                            backgroundColor: '#e3f2fd',
                            borderRadius: '12px',
                            marginBottom: '20px'
                        }}>
                            <h3 style={{ margin: '0 0 15px', color: '#007bff', fontSize: '16px' }}>
                                📱 GCash QR Code
                            </h3>
                            <p style={{ fontSize: '13px', color: '#666', marginBottom: '15px' }}>
                                Upload your GCash QR code to display when customers choose GCASH payment.
                            </p>

                            {/* Current QR Preview */}
                            <div style={{ textAlign: 'center', marginBottom: '15px' }}>
                                <p style={{ fontSize: '12px', color: '#888', marginBottom: '10px' }}>Current QR Code:</p>
                                <img
                                    src={qrPreview || gcashQrUrl}
                                    alt="Current GCash QR"
                                    style={{
                                        maxWidth: '150px',
                                        borderRadius: '8px',
                                        border: '2px solid #007bff',
                                        backgroundColor: 'white',
                                        padding: '5px'
                                    }}
                                    onError={(e) => e.target.style.display = 'none'}
                                />
                            </div>

                            {/* File Upload */}
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{
                                    display: 'block',
                                    padding: '15px',
                                    backgroundColor: 'white',
                                    border: '2px dashed #007bff',
                                    borderRadius: '8px',
                                    textAlign: 'center',
                                    cursor: qrSaving ? 'wait' : 'pointer',
                                    opacity: qrSaving ? 0.6 : 1
                                }}>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        style={{ display: 'none' }}
                                        disabled={qrSaving}
                                        onChange={(e) => {
                                            const file = e.target.files[0];
                                            if (file) {
                                                const reader = new FileReader();
                                                reader.onloadend = () => {
                                                    saveGcashQr(reader.result);
                                                };
                                                reader.readAsDataURL(file);
                                            }
                                        }}
                                    />
                                    <span style={{ color: '#007bff', fontWeight: 'bold' }}>
                                        {qrSaving ? '⏳ Saving...' : '📁 Click to upload new QR image'}
                                    </span>
                                    <p style={{ fontSize: '11px', color: '#888', margin: '5px 0 0' }}>
                                        Supports JPG, PNG, GIF
                                    </p>
                                </label>
                            </div>

                            {gcashQrUrl && (
                                <div style={{
                                    padding: '10px',
                                    backgroundColor: '#E8F5E9',
                                    borderRadius: '6px',
                                    textAlign: 'center',
                                    color: '#2E7D32',
                                    fontSize: '13px'
                                }}>
                                    ✓ QR Code saved to database
                                </div>
                            )}
                        </div>

                        {/* Close Button */}
                        <button
                            onClick={() => setShowSettings(false)}
                            style={{
                                width: '100%',
                                padding: '12px',
                                backgroundColor: '#5D4E37',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                fontSize: '14px'
                            }}
                        >
                            ✓ Done
                        </button>
                    </div>
                </div>
            )}

            {/* Logout Confirmation Modal */}
            {showLogoutModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center' }}>
                        <h3 style={{ color: '#5D4E37', marginBottom: '10px' }}>Confirm Logout</h3>
                        <p style={{ color: '#666', marginBottom: '20px' }}>Are you sure you want to log out of the Cashier System?</p>
                        <div className="modal-actions" style={{ justifyContent: 'center', gap: '15px' }}>
                            <button
                                onClick={cancelLogout}
                                style={{
                                    padding: '10px 20px',
                                    borderRadius: '6px',
                                    border: '1px solid #E0D5C7',
                                    background: 'white',
                                    color: '#5D4E37',
                                    cursor: 'pointer',
                                    fontWeight: 'bold'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmLogout}
                                style={{
                                    padding: '10px 20px',
                                    borderRadius: '6px',
                                    border: 'none',
                                    background: '#c62828',
                                    color: 'white',
                                    cursor: 'pointer',
                                    fontWeight: 'bold'
                                }}
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CashierLayout;
