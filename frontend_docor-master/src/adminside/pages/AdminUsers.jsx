import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import './Dashboard.css';

const AdminUsers = () => {
    const [staffAccounts, setStaffAccounts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        position: '',
        role_id: 2
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchStaffAccounts();
    }, []);

    const fetchStaffAccounts = async () => {
        try {
            const response = await adminAPI.getStaffAccounts();
            setStaffAccounts(response.data.data.staff || []);
        } catch (error) {
            console.error('Error fetching staff accounts:', error);
            setStaffAccounts([]);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            await adminAPI.createStaffAccount(formData);
            setSuccess('Staff account created successfully!');
            setShowModal(false);
            setFormData({
                first_name: '',
                last_name: '',
                email: '',
                password: '',
                position: '',
                role_id: 2
            });
            fetchStaffAccounts();
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to create staff account');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this staff account?')) return;

        try {
            await adminAPI.deleteStaffAccount(id);
            setSuccess('Staff account deleted successfully!');
            fetchStaffAccounts();
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to delete staff account');
        }
    };

    const getRoleBadgeClass = (roleName) => {
        switch (roleName) {
            case 'Cashier': return 'status-pending';
            case 'Staff': return 'status-completed';
            default: return 'status-confirmed';
        }
    };

    if (loading) return <div className="dashboard-loading"><div className="spinner"></div></div>;

    return (
        <div className="staff-management">
            {error && (
                <div style={{ padding: '10px 15px', backgroundColor: '#ffebee', color: '#c62828', borderRadius: '8px', marginBottom: '20px' }}>
                    {error}
                </div>
            )}
            {success && (
                <div style={{ padding: '10px 15px', backgroundColor: '#e8f5e9', color: '#2e7d32', borderRadius: '8px', marginBottom: '20px' }}>
                    {success}
                </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0, color: '#5D4E37' }}>Staff Accounts</h3>
                <button
                    onClick={() => setShowModal(true)}
                    style={{
                        backgroundColor: '#5D4E37',
                        color: 'white',
                        padding: '10px 20px',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                    }}
                >
                    + Add Staff Account
                </button>
            </div>

            <div className="dashboard-table">
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Position</th>
                                <th>Role</th>
                                <th>Created</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {staffAccounts.length > 0 ? (
                                staffAccounts.map(staff => (
                                    <tr key={staff.admin_id}>
                                        <td>#{staff.admin_id}</td>
                                        <td>{staff.first_name} {staff.last_name}</td>
                                        <td>{staff.email}</td>
                                        <td>{staff.position || 'N/A'}</td>
                                        <td>
                                            <span className={`status-badge ${getRoleBadgeClass(staff.role_name)}`}>
                                                {staff.role_name}
                                            </span>
                                        </td>
                                        <td>{new Date(staff.created_at).toLocaleDateString()}</td>
                                        <td>
                                            <button
                                                onClick={() => handleDelete(staff.admin_id)}
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}
                                                title="Delete"
                                            >
                                                🗑️
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className="no-data">No staff accounts found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Staff Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" style={{ maxWidth: '500px', textAlign: 'left' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ margin: 0, color: '#5D4E37' }}>Create Staff Account</h3>
                            <button
                                onClick={() => setShowModal(false)}
                                style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#999' }}
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 'bold' }}>First Name *</label>
                                    <input
                                        type="text"
                                        name="first_name"
                                        required
                                        value={formData.first_name}
                                        onChange={handleInputChange}
                                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #E0D5C7', fontFamily: 'Calibri' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 'bold' }}>Last Name *</label>
                                    <input
                                        type="text"
                                        name="last_name"
                                        required
                                        value={formData.last_name}
                                        onChange={handleInputChange}
                                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #E0D5C7', fontFamily: 'Calibri' }}
                                    />
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 'bold' }}>Email *</label>
                                <input
                                    type="email"
                                    name="email"
                                    required
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #E0D5C7', fontFamily: 'Calibri' }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 'bold' }}>Password *</label>
                                <input
                                    type="password"
                                    name="password"
                                    required
                                    minLength="6"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #E0D5C7', fontFamily: 'Calibri' }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 'bold' }}>Position</label>
                                <input
                                    type="text"
                                    name="position"
                                    value={formData.position}
                                    onChange={handleInputChange}
                                    placeholder="e.g., Cashier, Assistant"
                                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #E0D5C7', fontFamily: 'Calibri' }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 'bold' }}>Role *</label>
                                <select
                                    name="role_id"
                                    required
                                    value={formData.role_id}
                                    onChange={handleInputChange}
                                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #E0D5C7', fontFamily: 'Calibri' }}
                                >
                                    <option value={2}>Cashier (POS Only)</option>
                                    <option value={3}>Staff (Appointments, Reservations, Products)</option>
                                </select>
                                <p style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>
                                    Cashier: Access to CashierPOS only<br />
                                    Staff: Access to Appointments, Reservations, and Products
                                </p>
                            </div>

                            <div className="modal-actions" style={{ marginTop: '10px' }}>
                                <button type="button" className="modal-btn cancel" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="modal-btn confirm" style={{ backgroundColor: '#5D4E37' }}>Create Account</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminUsers;
