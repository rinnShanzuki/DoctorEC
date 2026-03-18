import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import './Dashboard.css';

const AdminRecords = () => {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedRow, setExpandedRow] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        fetchRecords();
    }, []);

    const fetchRecords = async () => {
        try {
            const response = await adminAPI.getRecords();
            console.log('Records response:', response);
            // Handle both response.data.data and response.data formats
            const data = response.data?.data || response.data || [];
            setRecords(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching records:', error);
            setRecords([]);
        } finally {
            setLoading(false);
        }
    };

    const toggleRow = (userId) => {
        if (expandedRow === userId) {
            setExpandedRow(null);
        } else {
            setExpandedRow(userId);
        }
    };

    const filteredRecords = records.filter(user =>
        (user.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Pagination calculations
    const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedRecords = filteredRecords.slice(startIndex, startIndex + itemsPerPage);

    // Reset to page 1 when search changes
    const handleSearch = (value) => {
        setSearchTerm(value);
        setCurrentPage(1);
    };

    if (loading) return <div className="dashboard-loading"><div className="spinner"></div></div>;

    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <h1>Patient Records</h1>
                <p className="dashboard-subtitle">View patient history and transactions</p>
            </div>

            <div style={{ marginBottom: '24px' }}>
                <input
                    type="text"
                    placeholder="Search patients..."
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
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
                            {paginatedRecords.map(user => (
                                <React.Fragment key={user.id}>
                                    <tr>
                                        <td>{user.name}</td>
                                        <td>{user.email}</td>
                                        <td>{user.phone || 'N/A'}</td>
                                        <td>{user.reservations.length + user.appointments.length}</td>
                                        <td>
                                            <button
                                                onClick={() => toggleRow(user.id)}
                                                style={{
                                                    background: 'none',
                                                    border: 'none',
                                                    color: '#5D4E37',
                                                    cursor: 'pointer',
                                                    fontWeight: 'bold'
                                                }}
                                            >
                                                {expandedRow === user.id ? 'Hide Details' : 'View Details'}
                                            </button>
                                        </td>
                                    </tr>
                                    {expandedRow === user.id && (
                                        <tr>
                                            <td colSpan="5" style={{ backgroundColor: '#F9F9F9', padding: '20px' }}>
                                                <div style={{ display: 'flex', gap: '40px' }}>
                                                    <div style={{ flex: 1 }}>
                                                        <h4 style={{ color: '#5D4E37', marginBottom: '10px' }}>Glasses Availed (Reservations)</h4>
                                                        {user.reservations.length > 0 ? (
                                                            <ul style={{ listStyle: 'none', padding: 0 }}>
                                                                {user.reservations.map(res => (
                                                                    <li key={res.id} style={{ marginBottom: '10px', padding: '10px', border: '1px solid #eee', borderRadius: '5px', backgroundColor: 'white' }}>
                                                                        <strong>Product:</strong> {res.product?.name || 'Unknown'}<br />
                                                                        <strong>Date:</strong> {new Date(res.created_at).toLocaleDateString()}<br />
                                                                        <strong>Status:</strong> {res.status}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        ) : <p>No glasses availed.</p>}
                                                    </div>
                                                    <div style={{ flex: 1 }}>
                                                        <h4 style={{ color: '#5D4E37', marginBottom: '10px' }}>Checkup History (Appointments)</h4>
                                                        {user.appointments.length > 0 ? (
                                                            <ul style={{ listStyle: 'none', padding: 0 }}>
                                                                {user.appointments.map(apt => (
                                                                    <li key={apt.id} style={{ marginBottom: '10px', padding: '10px', border: '1px solid #eee', borderRadius: '5px', backgroundColor: 'white' }}>
                                                                        <strong>Date:</strong> {apt.appointment_date}<br />
                                                                        <strong>Type:</strong> {apt.type}<br />
                                                                        <strong>Diagnosis:</strong> {apt.diagnosis || 'N/A'}<br />
                                                                        <strong>Prescription:</strong> {apt.prescription || 'N/A'}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        ) : <p>No checkup history.</p>}
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
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
                                {[...Array(totalPages)].map((_, i) => (
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
                                disabled={currentPage === totalPages}
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
        </div>
    );
};

export default AdminRecords;
