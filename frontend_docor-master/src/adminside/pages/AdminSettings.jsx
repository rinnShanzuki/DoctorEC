import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import AdminHistory from './AdminHistory';
import { useNotification } from '../hooks/useNotification';
import './Dashboard.css';

const AdminSettings = () => {
    const [activeTab, setActiveTab] = useState('staff');
    const { showNotification, NotificationModal } = useNotification();

    // Doctor staff states
    const [doctors, setDoctors] = useState([]);
    const [loadingDoctors, setLoadingDoctors] = useState(false);
    const [showDoctorModal, setShowDoctorModal] = useState(false);
    const [savingDoctor, setSavingDoctor] = useState(false);
    const [doctorForm, setDoctorForm] = useState({
        full_name: '',
        email: '',
        password: '',
        specialization: 'Optometrist',
        position: '',
        birthday: '',
        bio: '',
    });

    // Admin staff states
    const [admins, setAdmins] = useState([]);
    const [loadingAdmins, setLoadingAdmins] = useState(false);

    useEffect(() => {
        if (activeTab === 'staff') {
            fetchDoctors();
            fetchAdmins();
        }
    }, [activeTab]);

    // ============ Fetch Functions ============
    const fetchDoctors = async () => {
        setLoadingDoctors(true);
        try {
            const res = await adminAPI.getDoctors();
            setDoctors(res.data?.data || res.data || []);
        } catch (error) {
            console.error('Error fetching doctors:', error);
        } finally {
            setLoadingDoctors(false);
        }
    };

    const fetchAdmins = async () => {
        setLoadingAdmins(true);
        try {
            const res = await adminAPI.getStaffAccounts();
            setAdmins(res.data?.data || res.data || []);
        } catch (error) {
            console.error('Error fetching admins:', error);
            setAdmins([]);
        } finally {
            setLoadingAdmins(false);
        }
    };

    // ============ Doctor CRUD ============
    const handleDoctorFormChange = (e) => {
        setDoctorForm({ ...doctorForm, [e.target.name]: e.target.value });
    };

    const handleCreateDoctor = async (e) => {
        e.preventDefault();
        if (!doctorForm.full_name || !doctorForm.email || !doctorForm.password) {
            showNotification('Please fill in all required fields (Name, Email, Password).', 'error');
            return;
        }
        if (doctorForm.password.length < 6) {
            showNotification('Password must be at least 6 characters.', 'error');
            return;
        }
        setSavingDoctor(true);
        try {
            const formData = new FormData();
            formData.append('full_name', doctorForm.full_name);
            formData.append('email', doctorForm.email);
            formData.append('password', doctorForm.password);
            formData.append('specialization', doctorForm.specialization || 'Optometrist');
            formData.append('position', doctorForm.position || '');
            formData.append('birthday', doctorForm.birthday || '');
            formData.append('bio', doctorForm.bio || '');

            await adminAPI.createDoctor(formData);
            showNotification('Doctor account created successfully! They can now log in.', 'success');
            setShowDoctorModal(false);
            setDoctorForm({
                full_name: '', email: '', password: '', specialization: 'Optometrist',
                position: '', birthday: '', bio: ''
            });
            fetchDoctors();
        } catch (error) {
            console.error('Error creating doctor:', error);
            const msg = error.response?.data?.message || 'Failed to create doctor account.';
            showNotification(msg, 'error');
        } finally {
            setSavingDoctor(false);
        }
    };

    const handleDeleteDoctor = async (doctor) => {
        if (!window.confirm(`Are you sure you want to remove ${doctor.full_name}?`)) return;
        try {
            await adminAPI.deleteDoctor(doctor.doctor_id);
            showNotification('Doctor removed successfully.', 'success');
            fetchDoctors();
        } catch (error) {
            console.error('Error deleting doctor:', error);
            showNotification('Failed to remove doctor.', 'error');
        }
    };

    // ============ Helpers ============
    const getRoleName = (roleId) => {
        switch (roleId) {
            case 1: return 'Admin';
            case 2: return 'Cashier';
            case 3: return 'Staff';
            default: return 'Unknown';
        }
    };

    const getRoleBadgeColor = (roleId) => {
        switch (roleId) {
            case 1: return { background: '#E8F0FE', color: '#1A73E8' };
            case 2: return { background: '#E6F4EA', color: '#137333' };
            case 3: return { background: '#FEF7E0', color: '#B06000' };
            default: return { background: '#F1F3F4', color: '#5F6368' };
        }
    };

    // ============ Styles ============
    const tabBarStyle = {
        display: 'flex', gap: 0, marginBottom: 24,
        borderBottom: '2px solid #E0D5C7',
    };
    const tabStyle = (isActive) => ({
        padding: '12px 24px', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem',
        background: 'none', border: 'none', borderBottom: isActive ? '3px solid #5D4E37' : '3px solid transparent',
        color: isActive ? '#5D4E37' : '#999', transition: 'all 0.2s',
    });
    const cardStyle = {
        background: '#fff', borderRadius: 12, padding: 24, marginBottom: 20,
        border: '1px solid #E0D5C7', boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    };
    const sectionTitle = {
        fontSize: '1.05rem', fontWeight: 700, color: '#3E2F1C', marginBottom: 16,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    };
    const tableStyle = {
        width: '100%', borderCollapse: 'separate', borderSpacing: 0,
    };
    const thStyle = {
        background: '#F8F6F2', padding: '10px 16px', fontSize: '0.78rem', fontWeight: 600,
        color: '#8B7355', textTransform: 'uppercase', letterSpacing: 0.5,
        borderBottom: '1px solid #E0D5C7', textAlign: 'left',
    };
    const tdStyle = {
        padding: '14px 16px', fontSize: '0.88rem', color: '#3E2F1C',
        borderBottom: '1px solid #F1EDE7', verticalAlign: 'middle',
    };
    const btnPrimary = {
        padding: '10px 20px', backgroundColor: '#5D4E37', color: '#fff', border: 'none',
        borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem',
    };
    const btnDanger = {
        padding: '6px 14px', backgroundColor: '#fff', color: '#EA4335', border: '1.5px solid #EA4335',
        borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: '0.78rem',
    };
    const badgeStyle = (bg, color) => ({
        display: 'inline-block', padding: '3px 12px', borderRadius: 20,
        fontSize: '0.75rem', fontWeight: 600, background: bg, color: color,
    });
    const formGroupStyle = { marginBottom: 16 };
    const labelStyle = {
        display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#5D4E37',
        marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.3,
    };
    const inputStyle = {
        width: '100%', padding: '10px 14px', border: '1.5px solid #E0D5C7',
        borderRadius: 8, fontSize: '0.9rem', color: '#3E2F1C', background: '#FAFAF7',
        boxSizing: 'border-box',
    };
    const modalOverlayStyle = {
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center',
        justifyContent: 'center', zIndex: 1000,
    };
    const modalStyle = {
        background: '#fff', borderRadius: 16, width: '90%', maxWidth: 560,
        maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
    };

    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <h1>Settings</h1>
                <p className="dashboard-subtitle">Manage staff accounts and system settings</p>
            </div>

            {/* Tab Bar */}
            <div style={tabBarStyle}>
                <button style={tabStyle(activeTab === 'staff')} onClick={() => setActiveTab('staff')}>
                    👥 Staff Management
                </button>
                <button style={tabStyle(activeTab === 'history')} onClick={() => setActiveTab('history')}>
                    📜 Transaction History
                </button>
            </div>

            {/* ================================================================ */}
            {/* STAFF MANAGEMENT TAB */}
            {/* ================================================================ */}
            {activeTab === 'staff' && (
                <div>
                    {/* ---------- Doctor Accounts Section ---------- */}
                    <div style={cardStyle}>
                        <div style={sectionTitle}>
                            <span>🩺 Doctor Accounts</span>
                            <button style={btnPrimary} onClick={() => setShowDoctorModal(true)}>
                                + Add Doctor
                            </button>
                        </div>
                        <p style={{ fontSize: '0.82rem', color: '#8B7355', marginBottom: 16, marginTop: -8 }}>
                            Doctors can log in at the unified login page and access the Doctor Portal to manage appointments, sessions, and prescriptions.
                        </p>

                        {loadingDoctors ? (
                            <div style={{ textAlign: 'center', padding: 32, color: '#8B7355' }}>Loading doctors...</div>
                        ) : doctors.length > 0 ? (
                            <table style={tableStyle}>
                                <thead>
                                    <tr>
                                        <th style={thStyle}>Name</th>
                                        <th style={thStyle}>Email</th>
                                        <th style={thStyle}>Specialization</th>
                                        <th style={thStyle}>Status</th>
                                        <th style={thStyle}>Has Login</th>
                                        <th style={thStyle}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {doctors.map(doc => (
                                        <tr key={doc.doctor_id}>
                                            <td style={tdStyle}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                    <div style={{
                                                        width: 36, height: 36, borderRadius: '50%',
                                                        background: 'linear-gradient(135deg, #5D4E37, #8B7355)',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        color: '#fff', fontWeight: 700, fontSize: '0.8rem',
                                                        overflow: 'hidden',
                                                    }}>
                                                        {doc.image ? (
                                                            <img src={doc.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                        ) : (
                                                            doc.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                                                        )}
                                                    </div>
                                                    <strong>{doc.full_name}</strong>
                                                </div>
                                            </td>
                                            <td style={tdStyle}>{doc.email || '—'}</td>
                                            <td style={tdStyle}>{doc.specialization || '—'}</td>
                                            <td style={tdStyle}>
                                                <span style={badgeStyle(
                                                    doc.status === 'on-duty' ? '#E6F4EA' : '#FEF7E0',
                                                    doc.status === 'on-duty' ? '#137333' : '#B06000'
                                                )}>
                                                    {doc.status || 'on-duty'}
                                                </span>
                                            </td>
                                            <td style={tdStyle}>
                                                <span style={badgeStyle(
                                                    doc.has_password ? '#E6F4EA' : '#FCE8E6',
                                                    doc.has_password ? '#137333' : '#C5221F'
                                                )}>
                                                    {doc.has_password ? '✅ Yes' : '❌ No'}
                                                </span>
                                            </td>
                                            <td style={tdStyle}>
                                                <button style={btnDanger} onClick={() => handleDeleteDoctor(doc)}>
                                                    Remove
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div style={{ textAlign: 'center', padding: 40, color: '#8B7355' }}>
                                <div style={{ fontSize: '2rem', marginBottom: 8, opacity: 0.4 }}>🩺</div>
                                <strong>No doctors yet</strong>
                                <p style={{ fontSize: '0.82rem', marginTop: 4 }}>
                                    Click "Add Doctor" to create a doctor account.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* ---------- Admin / Staff Accounts Section ---------- */}
                    <div style={cardStyle}>
                        <div style={sectionTitle}>
                            <span>🔑 Admin &amp; Staff Accounts</span>
                        </div>

                        {loadingAdmins ? (
                            <div style={{ textAlign: 'center', padding: 32, color: '#8B7355' }}>Loading accounts...</div>
                        ) : admins.length > 0 ? (
                            <table style={tableStyle}>
                                <thead>
                                    <tr>
                                        <th style={thStyle}>Name</th>
                                        <th style={thStyle}>Email</th>
                                        <th style={thStyle}>Role</th>
                                        <th style={thStyle}>Position</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {admins.map(admin => {
                                        const roleColors = getRoleBadgeColor(admin.role_id);
                                        return (
                                            <tr key={admin.admin_id}>
                                                <td style={tdStyle}>
                                                    <strong>{admin.first_name} {admin.last_name}</strong>
                                                </td>
                                                <td style={tdStyle}>{admin.email}</td>
                                                <td style={tdStyle}>
                                                    <span style={badgeStyle(roleColors.background, roleColors.color)}>
                                                        {getRoleName(admin.role_id)}
                                                    </span>
                                                </td>
                                                <td style={tdStyle}>{admin.position || '—'}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        ) : (
                            <div style={{ textAlign: 'center', padding: 32, color: '#8B7355' }}>
                                No admin accounts found.
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ================================================================ */}
            {/* HISTORY TAB */}
            {/* ================================================================ */}
            {activeTab === 'history' && (
                <div className="settings-content">
                    <AdminHistory isEmbedded={true} />
                </div>
            )}

            {/* ================================================================ */}
            {/* ADD DOCTOR MODAL */}
            {/* ================================================================ */}
            {showDoctorModal && (
                <div style={modalOverlayStyle} onClick={() => setShowDoctorModal(false)}>
                    <div style={modalStyle} onClick={e => e.stopPropagation()}>
                        <div style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '20px 24px', borderBottom: '1px solid #E0D5C7',
                        }}>
                            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#3E2F1C' }}>
                                🩺 Create Doctor Account
                            </h3>
                            <button
                                onClick={() => setShowDoctorModal(false)}
                                style={{
                                    width: 32, height: 32, borderRadius: '50%', border: 'none',
                                    background: '#F1EDE7', cursor: 'pointer', fontSize: '1.1rem',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: '#5F6368',
                                }}
                            >×</button>
                        </div>

                        <form onSubmit={handleCreateDoctor}>
                            <div style={{ padding: 24 }}>
                                <div style={{
                                    background: '#FEF7E0', border: '1px solid #FEEFC3',
                                    borderRadius: 8, padding: '10px 14px', marginBottom: 20,
                                    fontSize: '0.82rem', color: '#5F3400',
                                }}>
                                    ⚡ The doctor will use the <strong>email</strong> and <strong>password</strong> below to log in at the unified login page and access the Doctor Portal.
                                </div>

                                <div style={formGroupStyle}>
                                    <label style={labelStyle}>Full Name *</label>
                                    <input
                                        style={inputStyle}
                                        type="text"
                                        name="full_name"
                                        value={doctorForm.full_name}
                                        onChange={handleDoctorFormChange}
                                        placeholder="Dr. Juan Dela Cruz"
                                        required
                                    />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                    <div style={formGroupStyle}>
                                        <label style={labelStyle}>Email Address *</label>
                                        <input
                                            style={inputStyle}
                                            type="email"
                                            name="email"
                                            value={doctorForm.email}
                                            onChange={handleDoctorFormChange}
                                            placeholder="doctor@clinic.com"
                                            required
                                        />
                                    </div>
                                    <div style={formGroupStyle}>
                                        <label style={labelStyle}>Password *</label>
                                        <input
                                            style={inputStyle}
                                            type="password"
                                            name="password"
                                            value={doctorForm.password}
                                            onChange={handleDoctorFormChange}
                                            placeholder="Min. 6 characters"
                                            required
                                            minLength={6}
                                        />
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                    <div style={formGroupStyle}>
                                        <label style={labelStyle}>Specialization</label>
                                        <select
                                            style={inputStyle}
                                            name="specialization"
                                            value={doctorForm.specialization}
                                            onChange={handleDoctorFormChange}
                                        >
                                            <option>Optometrist</option>
                                            <option>Ophthalmologist</option>
                                            <option>General Practitioner</option>
                                            <option>Pediatric Optometrist</option>
                                        </select>
                                    </div>
                                    <div style={formGroupStyle}>
                                        <label style={labelStyle}>Position</label>
                                        <input
                                            style={inputStyle}
                                            type="text"
                                            name="position"
                                            value={doctorForm.position}
                                            onChange={handleDoctorFormChange}
                                            placeholder="e.g., Chief Optometrist"
                                        />
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                    <div style={formGroupStyle}>
                                        <label style={labelStyle}>Birthday</label>
                                        <input
                                            style={inputStyle}
                                            type="date"
                                            name="birthday"
                                            value={doctorForm.birthday}
                                            onChange={handleDoctorFormChange}
                                        />
                                    </div>
                                </div>

                                <div style={formGroupStyle}>
                                    <label style={labelStyle}>Bio</label>
                                    <textarea
                                        style={{ ...inputStyle, minHeight: 80, resize: 'vertical', fontFamily: 'inherit' }}
                                        name="bio"
                                        value={doctorForm.bio}
                                        onChange={handleDoctorFormChange}
                                        placeholder="Short bio about the doctor..."
                                    />
                                </div>
                            </div>

                            <div style={{
                                padding: '16px 24px', borderTop: '1px solid #E0D5C7',
                                display: 'flex', justifyContent: 'flex-end', gap: 10,
                            }}>
                                <button
                                    type="button"
                                    onClick={() => setShowDoctorModal(false)}
                                    style={{
                                        padding: '10px 20px', background: 'transparent', color: '#5D4E37',
                                        border: '1.5px solid #5D4E37', borderRadius: 8, cursor: 'pointer',
                                        fontWeight: 600, fontSize: '0.85rem',
                                    }}
                                >
                                    Cancel
                                </button>
                                <button type="submit" style={btnPrimary} disabled={savingDoctor}>
                                    {savingDoctor ? 'Creating...' : '🩺 Create Doctor Account'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <NotificationModal />
        </div>
    );
};

export default AdminSettings;
