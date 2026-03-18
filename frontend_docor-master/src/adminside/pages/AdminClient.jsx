import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import './Dashboard.css';

const AdminClient = () => {
    // Tab state
    const [activeTab, setActiveTab] = useState('patients'); // 'patients' or 'users'

    // ============ PATIENT RECORDS STATE ============
    const [records, setRecords] = useState([]);
    const [recordsLoading, setRecordsLoading] = useState(true);
    const [patientSearchTerm, setPatientSearchTerm] = useState('');
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // ============ ONLINE USERS STATE ============
    const [users, setUsers] = useState([]);
    const [usersLoading, setUsersLoading] = useState(true);
    const [userSearchTerm, setUserSearchTerm] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);

    // Fetch data on mount
    useEffect(() => {
        fetchRecords();
        fetchUsers();
    }, []);

    // ============ PATIENT RECORDS FUNCTIONS ============
    const fetchRecords = async () => {
        try {
            const response = await adminAPI.getRecords();
            const data = response.data?.data || response.data || [];
            setRecords(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching records:', error);
            setRecords([]);
        } finally {
            setRecordsLoading(false);
        }
    };

    const filteredRecords = records.filter(user =>
        (user.name || '').toLowerCase().includes(patientSearchTerm.toLowerCase()) ||
        (user.email || '').toLowerCase().includes(patientSearchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedRecords = filteredRecords.slice(startIndex, startIndex + itemsPerPage);

    const handlePatientSearch = (value) => {
        setPatientSearchTerm(value);
        setCurrentPage(1);
    };

    // ============ ONLINE USERS FUNCTIONS ============
    const fetchUsers = async () => {
        try {
            const response = await adminAPI.getClients();
            const data = response.data.data || response.data || [];
            setUsers(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching clients:', error);
            setUsers([]);
        } finally {
            setUsersLoading(false);
        }
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch = (user.name || '').toLowerCase().includes(userSearchTerm.toLowerCase()) ||
            (user.email || '').toLowerCase().includes(userSearchTerm.toLowerCase()) ||
            (user.id && user.id.toString().includes(userSearchTerm));
        return matchesSearch;
    });

    const loading = activeTab === 'patients' ? recordsLoading : usersLoading;
    if (loading) return <div className="dashboard-loading"><div className="spinner"></div></div>;

    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <h1>Patient & User Management</h1>
                <p className="dashboard-subtitle">Manage patient records and registered users</p>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '0', marginBottom: '24px', borderBottom: '2px solid #E0D5C7' }}>
                <button
                    onClick={() => setActiveTab('patients')}
                    style={{
                        padding: '12px 24px',
                        backgroundColor: activeTab === 'patients' ? '#5D4E37' : 'transparent',
                        color: activeTab === 'patients' ? 'white' : '#5D4E37',
                        border: 'none',
                        borderRadius: '8px 8px 0 0',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '14px',
                        marginBottom: '-2px'
                    }}
                >
                    Patient Records
                </button>
                <button
                    onClick={() => setActiveTab('users')}
                    style={{
                        padding: '12px 24px',
                        backgroundColor: activeTab === 'users' ? '#5D4E37' : 'transparent',
                        color: activeTab === 'users' ? 'white' : '#5D4E37',
                        border: 'none',
                        borderRadius: '8px 8px 0 0',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '14px',
                        marginBottom: '-2px'
                    }}
                >
                    Online Users
                </button>
            </div>

            {/* ============ PATIENT RECORDS TAB ============ */}
            {activeTab === 'patients' && (
                <>
                    <div style={{ marginBottom: '24px' }}>
                        <input
                            type="text"
                            placeholder="Search patients..."
                            value={patientSearchTerm}
                            onChange={(e) => handlePatientSearch(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '8px',
                                border: '1px solid #E0D5C7',
                                fontFamily: 'Calibri, sans-serif',
                                fontSize: '14px'
                            }}
                        />
                    </div>

                    <div className="dashboard-table">
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Phone</th>
                                        <th>Total Transactions</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedRecords.length > 0 ? paginatedRecords.map(user => (
                                        <tr key={user.id}>
                                            <td>{user.name}</td>
                                            <td>{user.email}</td>
                                            <td>{user.phone || 'N/A'}</td>
                                            <td>{(user.reservations?.length || 0) + (user.appointments?.length || 0)}</td>
                                            <td>
                                                <button
                                                    onClick={() => setSelectedPatient(user)}
                                                    style={{
                                                        background: 'none',
                                                        border: 'none',
                                                        color: '#5D4E37',
                                                        cursor: 'pointer',
                                                        fontWeight: 'bold'
                                                    }}
                                                >
                                                    View Details
                                                </button>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="5" className="no-data">No patient records found</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Controls */}
                        {filteredRecords.length > 0 && (
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginTop: '20px',
                                padding: '15px',
                                backgroundColor: '#f9f9f9',
                                borderRadius: '8px'
                            }}>
                                <span style={{ color: '#666', fontSize: '14px' }}>
                                    Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredRecords.length)} of {filteredRecords.length} patients
                                </span>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                        style={{
                                            padding: '8px 15px',
                                            borderRadius: '6px',
                                            border: '1px solid #E0D5C7',
                                            backgroundColor: currentPage === 1 ? '#f0f0f0' : 'white',
                                            color: currentPage === 1 ? '#999' : '#5D4E37',
                                            cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                                            fontWeight: 'bold'
                                        }}
                                    >
                                        ← Previous
                                    </button>
                                    <div style={{ display: 'flex', gap: '4px' }}>
                                        {[...Array(Math.max(totalPages, 1))].map((_, i) => (
                                            <button
                                                key={i + 1}
                                                onClick={() => setCurrentPage(i + 1)}
                                                style={{
                                                    padding: '8px 12px',
                                                    borderRadius: '6px',
                                                    border: currentPage === i + 1 ? 'none' : '1px solid #E0D5C7',
                                                    backgroundColor: currentPage === i + 1 ? '#5D4E37' : 'white',
                                                    color: currentPage === i + 1 ? 'white' : '#5D4E37',
                                                    cursor: 'pointer',
                                                    fontWeight: currentPage === i + 1 ? 'bold' : 'normal'
                                                }}
                                            >
                                                {i + 1}
                                            </button>
                                        ))}
                                    </div>
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                        disabled={currentPage === totalPages || totalPages === 0}
                                        style={{
                                            padding: '8px 15px',
                                            borderRadius: '6px',
                                            border: '1px solid #E0D5C7',
                                            backgroundColor: currentPage === totalPages ? '#f0f0f0' : 'white',
                                            color: currentPage === totalPages ? '#999' : '#5D4E37',
                                            cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                                            fontWeight: 'bold'
                                        }}
                                    >
                                        Next →
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* ============ ONLINE USERS TAB ============ */}
            {activeTab === 'users' && (
                <>
                    <div style={{ marginBottom: '24px' }}>
                        <input
                            type="text"
                            placeholder="Search users by name, email, or ID..."
                            value={userSearchTerm}
                            onChange={(e) => setUserSearchTerm(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '8px',
                                border: '1px solid #E0D5C7',
                                fontFamily: 'Calibri, sans-serif',
                                fontSize: '14px'
                            }}
                        />
                    </div>

                    <div className="dashboard-table">
                        <div className="table-header">
                            <h3>All Users</h3>
                        </div>
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Joined Date</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.length > 0 ? (
                                        filteredUsers.map(user => (
                                            <tr key={user.id}>
                                                <td>#{user.id}</td>
                                                <td>{user.name}</td>
                                                <td>{user.email}</td>
                                                <td>{user.joinedDate || 'N/A'}</td>
                                                <td>
                                                    <button
                                                        onClick={() => setSelectedUser(user)}
                                                        style={{
                                                            background: 'none',
                                                            border: 'none',
                                                            color: '#5D4E37',
                                                            cursor: 'pointer',
                                                            fontWeight: 'bold'
                                                        }}
                                                    >
                                                        View
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5" className="no-data">No users found</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {/* ============ PATIENT DETAILS MODAL ============ */}
            {selectedPatient && (
                <div className="modal-overlay" onClick={() => setSelectedPatient(null)}>
                    <div className="modal-content" style={{ maxWidth: '700px', textAlign: 'left' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ color: '#5D4E37', margin: 0 }}>Patient Details: {selectedPatient.name}</h3>
                            <button
                                onClick={() => setSelectedPatient(null)}
                                style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#999' }}
                            >
                                ×
                            </button>
                        </div>

                        <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
                            <p><strong>Email:</strong> {selectedPatient.email}</p>
                            <p><strong>Phone:</strong> {selectedPatient.phone || 'N/A'}</p>
                            <p><strong>Total Transactions:</strong> {(selectedPatient.reservations?.length || 0) + (selectedPatient.appointments?.length || 0)}</p>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div>
                                <h4 style={{ color: '#5D4E37', marginBottom: '10px' }}>🕶️ Glasses Availed (Reservations)</h4>
                                {selectedPatient.reservations?.length > 0 ? (
                                    <ul style={{ listStyle: 'none', padding: 0, maxHeight: '200px', overflowY: 'auto' }}>
                                        {selectedPatient.reservations.map(res => (
                                            <li key={res.id} style={{ marginBottom: '10px', padding: '10px', border: '1px solid #eee', borderRadius: '5px', backgroundColor: 'white' }}>
                                                <strong>Product:</strong> {res.product?.name || 'Unknown'}<br />
                                                <strong>Date:</strong> {new Date(res.created_at).toLocaleDateString()}<br />
                                                <strong>Status:</strong> <span style={{ color: res.status === 'Completed' ? 'green' : res.status === 'Pending' ? 'orange' : '#333' }}>{res.status}</span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : <p style={{ color: '#999' }}>No glasses availed.</p>}
                            </div>
                            <div>
                                <h4 style={{ color: '#5D4E37', marginBottom: '10px' }}>🩺 Checkup History (Appointments)</h4>
                                {selectedPatient.appointments?.length > 0 ? (
                                    <ul style={{ listStyle: 'none', padding: 0, maxHeight: '200px', overflowY: 'auto' }}>
                                        {selectedPatient.appointments.map(apt => (
                                            <li key={apt.id} style={{ marginBottom: '10px', padding: '10px', border: '1px solid #eee', borderRadius: '5px', backgroundColor: 'white' }}>
                                                <strong>Date:</strong> {apt.appointment_date}<br />
                                                <strong>Type:</strong> {apt.type}<br />
                                                <strong>Diagnosis:</strong> {apt.diagnosis || 'N/A'}<br />
                                                <strong>Prescription:</strong> {apt.prescription || 'N/A'}
                                            </li>
                                        ))}
                                    </ul>
                                ) : <p style={{ color: '#999' }}>No checkup history.</p>}
                            </div>
                        </div>

                        <div className="modal-actions" style={{ marginTop: '20px' }}>
                            <button className="modal-btn cancel" onClick={() => setSelectedPatient(null)}>Close</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ============ USER DETAILS MODAL ============ */}
            {selectedUser && (
                <div className="modal-overlay" onClick={() => setSelectedUser(null)}>
                    <div className="modal-content" style={{ maxWidth: '500px', textAlign: 'left' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ color: '#5D4E37', margin: 0 }}>User Details</h3>
                            <button
                                onClick={() => setSelectedUser(null)}
                                style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#999' }}
                            >
                                ×
                            </button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div>
                                <h4 style={{ color: '#5D4E37', marginBottom: '10px' }}>📋 Account Information</h4>
                                <p><strong>User ID:</strong> #{selectedUser.id}</p>
                                <p><strong>Full Name:</strong> {selectedUser.name}</p>
                                <p><strong>Email:</strong> {selectedUser.email}</p>
                                <p><strong>Phone:</strong> {selectedUser.phone || 'N/A'}</p>
                                <p><strong>Joined:</strong> {selectedUser.joinedDate || 'N/A'}</p>
                            </div>
                            <div>
                                <h4 style={{ color: '#5D4E37', marginBottom: '10px' }}>📍 Additional Details</h4>
                                <p><strong>Address:</strong> {selectedUser.address || 'N/A'}</p>
                                <p><strong>Birthdate:</strong> {selectedUser.birthdate || 'N/A'}</p>
                                <p><strong>Gender:</strong> {selectedUser.gender || 'N/A'}</p>
                            </div>
                        </div>

                        <div className="modal-actions" style={{ marginTop: '20px' }}>
                            <button className="modal-btn cancel" onClick={() => setSelectedUser(null)}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminClient;
