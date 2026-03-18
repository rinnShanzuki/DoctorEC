import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { MdDashboard, MdEventNote, MdOutlineSchedule, MdPeople } from 'react-icons/md';
import doctorAuthService from '../services/doctorAuthService';
import logo from '../assets/logo.jpg';
import './DoctorLayout.css';

const DoctorLayout = () => {
    const navigate = useNavigate();
    const doctor = doctorAuthService.getStoredDoctor();
    const [isSidebarHidden, setIsSidebarHidden] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    const handleLogout = async () => {
        await doctorAuthService.logout();
        setShowLogoutModal(false);
        navigate('/login');
    };

    const initial = doctor?.full_name?.charAt(0).toUpperCase() || 'D';

    return (
        <div className="doctor-container">
            {/* Sidebar */}
            <aside className={`doctor-sidebar ${isSidebarHidden ? 'hidden' : ''}`}>
                <div className="dsidebar-header">
                    <div className="dbrand-container">
                        <div className="dadmin-logo">
                            <img src={logo} alt="Doctor EC Logo" className="dlogo-image" />
                        </div>
                        <h2>Doctor EC Optical Clinic</h2>
                    </div>
                </div>
                <nav className="dsidebar-nav">
                    <NavLink to="/doctor" end className={({ isActive }) => `dnav-item ${isActive ? 'active' : ''}`}>
                        <MdDashboard className="dnav-icon" />
                        <span>Dashboard</span>
                    </NavLink>
                    <NavLink to="/doctor/appointments" className={({ isActive }) => `dnav-item ${isActive ? 'active' : ''}`}>
                        <MdEventNote className="dnav-icon" />
                        <span>Appointments</span>
                    </NavLink>
                    <NavLink to="/doctor/patients" className={({ isActive }) => `dnav-item ${isActive ? 'active' : ''}`}>
                        <MdPeople className="dnav-icon" />
                        <span>Patients</span>
                    </NavLink>
                    <NavLink to="/doctor/schedule" className={({ isActive }) => `dnav-item ${isActive ? 'active' : ''}`}>
                        <MdOutlineSchedule className="dnav-icon" />
                        <span>My Schedule</span>
                    </NavLink>
                </nav>
            </aside>

            {/* Main Content */}
            <div className={`doctor-main ${isSidebarHidden ? 'full-width' : ''}`}>
                {/* Top Navbar */}
                <header className="doctor-navbar">
                    <div className="dnavbar-left">
                        <button
                            className="dsidebar-toggle"
                            onClick={() => setIsSidebarHidden(!isSidebarHidden)}
                        >
                            ☰
                        </button>
                        <h1 className="dpage-title">Doctor Portal</h1>
                    </div>
                    <div className="dnavbar-right">
                        <div className="dprofile-section">
                            <button
                                className="dprofile-button"
                                onClick={() => setShowProfileMenu(!showProfileMenu)}
                            >
                                <div className="dprofile-icon">{initial}</div>
                                <span className="dprofile-name">{doctor?.full_name || 'Doctor'}</span>
                                <span className="ddropdown-arrow">▼</span>
                            </button>

                            {showProfileMenu && (
                                <div className="dprofile-dropdown">
                                    <div className="ddropdown-header">
                                        <p className="ddropdown-name">{doctor?.full_name || 'Doctor'}</p>
                                        <p className="ddropdown-email">{doctor?.specialization || 'Optometrist'}</p>
                                    </div>
                                    <button className="ddropdown-item logout" onClick={() => { setShowProfileMenu(false); setShowLogoutModal(true); }}>
                                        Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="doctor-content">
                    <Outlet />
                </main>

                {/* Logout Confirmation Modal */}
                {showLogoutModal && (
                    <div className="dmodal-overlay">
                        <div className="dmodal-content">
                            <h3>Confirm Logout</h3>
                            <p>Are you sure you want to log out?</p>
                            <div className="dmodal-actions">
                                <button className="dmodal-btn cancel" onClick={() => setShowLogoutModal(false)}>Cancel</button>
                                <button className="dmodal-btn confirm" onClick={handleLogout}>Log Out</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DoctorLayout;
