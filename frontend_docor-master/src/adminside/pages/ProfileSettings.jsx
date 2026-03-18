import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import './Dashboard.css'; // Reuse dashboard styles for consistency

const ProfileSettings = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('profile');
    const [profileImage, setProfileImage] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);

    // Mock Admin List Data
    const admins = [
        { id: 1, name: 'Admin User', email: 'admin@optidoc.com', role: 'Super Admin', status: 'Active' },
        { id: 2, name: 'Dr. Smith', email: 'smith@optidoc.com', role: 'Doctor', status: 'Active' },
        { id: 3, name: 'Staff Member', email: 'staff@optidoc.com', role: 'Staff', status: 'Inactive' },
    ];

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setProfileImage(file);
            setPreviewImage(URL.createObjectURL(file));
        }
    };

    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <h1>Profile Settings</h1>
                <p className="dashboard-subtitle">Manage your account and view admin list</p>
            </div>

            <div className="profile-container" style={{ display: 'flex', gap: '24px', flexDirection: 'column' }}>

                {/* Profile Header Card */}
                <div className="chart-container" style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                    <div className="profile-image-section" style={{ position: 'relative' }}>
                        <div style={{
                            width: '100px',
                            height: '100px',
                            borderRadius: '50%',
                            backgroundColor: '#E0D5C7',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden',
                            border: '3px solid #5D4E37'
                        }}>
                            {previewImage ? (
                                <img src={previewImage} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <span style={{ fontSize: '2rem', color: '#5D4E37', fontWeight: 'bold' }}>
                                    {user?.name?.charAt(0).toUpperCase() || 'A'}
                                </span>
                            )}
                        </div>
                        <label htmlFor="profile-upload" style={{
                            position: 'absolute',
                            bottom: '0',
                            right: '0',
                            backgroundColor: '#5D4E37',
                            color: 'white',
                            borderRadius: '50%',
                            width: '32px',
                            height: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            border: '2px solid white'
                        }}>
                            📷
                        </label>
                        <input
                            type="file"
                            id="profile-upload"
                            hidden
                            accept="image/*"
                            onChange={handleImageChange}
                        />
                    </div>
                    <div>
                        <h2 style={{ margin: '0 0 4px 0', color: '#5D4E37', fontFamily: 'Calibri, sans-serif' }}>{user?.name}</h2>
                        <p style={{ margin: '0', color: '#8B7355', fontFamily: 'Calibri, sans-serif' }}>{user?.email}</p>
                        <span className="status-badge status-confirmed" style={{ marginTop: '8px' }}>Active</span>
                    </div>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid #E0D5C7', paddingBottom: '10px' }}>
                    <button
                        onClick={() => setActiveTab('profile')}
                        style={{
                            padding: '8px 16px',
                            background: activeTab === 'profile' ? '#5D4E37' : 'none',
                            color: activeTab === 'profile' ? 'white' : '#5D4E37',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontFamily: 'Calibri, sans-serif',
                            fontWeight: 'bold'
                        }}
                    >
                        Edit Profile
                    </button>
                    <button
                        onClick={() => setActiveTab('admins')}
                        style={{
                            padding: '8px 16px',
                            background: activeTab === 'admins' ? '#5D4E37' : 'none',
                            color: activeTab === 'admins' ? 'white' : '#5D4E37',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontFamily: 'Calibri, sans-serif',
                            fontWeight: 'bold'
                        }}
                    >
                        Admin List
                    </button>
                </div>

                {/* Content */}
                {activeTab === 'profile' ? (
                    <div className="chart-container">
                        <h3 style={{ marginBottom: '20px' }}>Personal Information</h3>
                        <form style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '15px', color: '#5D4E37', fontWeight: 'bold' }}>Full Name</label>
                                <input type="text" defaultValue={user?.name} style={{
                                    padding: '10px',
                                    borderRadius: '6px',
                                    border: '1px solid #E0D5C7',
                                    fontFamily: 'Calibri, sans-serif'
                                }} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '15px', color: '#5D4E37', fontWeight: 'bold' }}>Email Address</label>
                                <input type="email" defaultValue={user?.email} style={{
                                    padding: '10px',
                                    borderRadius: '6px',
                                    border: '1px solid #E0D5C7',
                                    fontFamily: 'Calibri, sans-serif'
                                }} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '15px', color: '#5D4E37', fontWeight: 'bold' }}>Phone Number</label>
                                <input type="tel" placeholder="+1 234 567 890" style={{
                                    padding: '10px',
                                    borderRadius: '6px',
                                    border: '1px solid #E0D5C7',
                                    fontFamily: 'Calibri, sans-serif'
                                }} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '15px', color: '#5D4E37', fontWeight: 'bold' }}>Role</label>
                                <input type="text" value="Administrator" disabled style={{
                                    padding: '10px',
                                    borderRadius: '6px',
                                    border: '1px solid #E0D5C7',
                                    backgroundColor: '#F5F1EE',
                                    fontFamily: 'Calibri, sans-serif',
                                    color: '#8B7355'
                                }} />
                            </div>
                            <div style={{ gridColumn: '1 / -1', marginTop: '10px' }}>
                                <button type="button" style={{
                                    backgroundColor: '#5D4E37',
                                    color: 'white',
                                    border: 'none',
                                    padding: '10px 24px',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontFamily: 'Calibri, sans-serif',
                                    fontWeight: 'bold'
                                }}>
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                ) : (
                    <div className="dashboard-table">
                        <div className="table-header">
                            <h3>Admin Users List</h3>
                            <button className="view-all-btn">+ Add New Admin</button>
                        </div>
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Role</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {admins.map((admin) => (
                                        <tr key={admin.id}>
                                            <td>#{admin.id}</td>
                                            <td>{admin.name}</td>
                                            <td>{admin.email}</td>
                                            <td>{admin.role}</td>
                                            <td>
                                                <span className={`status-badge ${admin.status === 'Active' ? 'status-completed' : 'status-cancelled'}`}>
                                                    {admin.status}
                                                </span>
                                            </td>
                                            <td>
                                                <button style={{ background: 'none', border: 'none', cursor: 'pointer', marginRight: '8px' }}>✏️</button>
                                                <button style={{ background: 'none', border: 'none', cursor: 'pointer' }}>🗑️</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProfileSettings;
