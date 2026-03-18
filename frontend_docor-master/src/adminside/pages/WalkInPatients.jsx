import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import { cachedGet } from '../../services/apiCache';
import './Dashboard.css';

const WalkInPatients = () => {
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('id_asc');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const navigate = useNavigate();

    useEffect(() => {
        fetchPatients();
    }, []);

    const fetchPatients = async () => {
        try {
            const { data: response, fromCache } = await cachedGet('/patients');
            const data = response.data?.data || response.data || [];
            // Walk-in patients: those without a client_id (not linked to an online account)
            const walkIn = Array.isArray(data) ? data.filter(p => !p.client_id) : [];
            setPatients(walkIn);
            if (fromCache) setLoading(false);
        } catch (error) {
            console.error('Error fetching patients:', error);
            setPatients([]);
        } finally {
            setLoading(false);
        }
    };

    const filteredPatients = patients.filter(p =>
        (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.patient_code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.phone || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Sort
    const sortedPatients = [...filteredPatients].sort((a, b) => {
        switch (sortBy) {
            case 'id_asc': return (a.id || 0) - (b.id || 0);
            case 'id_desc': return (b.id || 0) - (a.id || 0);
            case 'name_asc': return (a.name || '').localeCompare(b.name || '');
            case 'name_desc': return (b.name || '').localeCompare(a.name || '');
            case 'email_asc': return (a.email || '').localeCompare(b.email || '');
            case 'email_desc': return (b.email || '').localeCompare(a.email || '');
            default: return 0;
        }
    });

    const totalPages = Math.ceil(sortedPatients.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedPatients = sortedPatients.slice(startIndex, startIndex + itemsPerPage);

    const handleSearch = (value) => {
        setSearchTerm(value);
        setCurrentPage(1);
    };

    if (loading) return <div className="dashboard-loading"><div className="spinner"></div></div>;

    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <h1>Walk-in Patients</h1>
                <p className="dashboard-subtitle">View and manage walk-in patient records</p>
            </div>

            <div style={{ marginBottom: '24px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                <input
                    type="text"
                    placeholder="Search by name, email, patient no., or contact..."
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    style={{
                        flex: 1,
                        padding: '12px',
                        borderRadius: '8px',
                        border: '1px solid #E0D5C7',
                        fontFamily: 'Calibri, sans-serif',
                        fontSize: '14px'
                    }}
                />
                <select
                    value={sortBy}
                    onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}
                    style={{
                        padding: '12px 16px',
                        borderRadius: '8px',
                        border: '1px solid #E0D5C7',
                        fontFamily: 'Calibri, sans-serif',
                        fontSize: '14px',
                        backgroundColor: 'white',
                        color: '#5D4E37',
                        cursor: 'pointer',
                        minWidth: '180px',
                        fontWeight: '500'
                    }}
                >
                    <option value="id_asc">Sort by ID ↑</option>
                    <option value="id_desc">Sort by ID ↓</option>
                    <option value="name_asc">Sort by Name A–Z</option>
                    <option value="name_desc">Sort by Name Z–A</option>
                    <option value="email_asc">Sort by Email A–Z</option>
                    <option value="email_desc">Sort by Email Z–A</option>
                </select>
            </div>

            <div className="dashboard-table">
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Patient No.</th>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Contact No.</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedPatients.length > 0 ? paginatedPatients.map(patient => (
                                <tr key={patient.id}>
                                    <td style={{ fontWeight: '600', color: '#5D4E37' }}>
                                        {patient.patient_code || `P-${patient.id}`}
                                    </td>
                                    <td>{patient.name}</td>
                                    <td>{patient.email || 'N/A'}</td>
                                    <td>{patient.phone || 'N/A'}</td>
                                    <td>
                                        <button
                                            onClick={() => navigate(`/admin/dashboard/patients/${patient.id}`)}
                                            style={{
                                                background: 'linear-gradient(135deg, #5D4E37, #8B7355)',
                                                color: 'white',
                                                border: 'none',
                                                padding: '8px 16px',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                fontSize: '13px',
                                                fontWeight: '600',
                                                transition: 'all 0.2s ease',
                                            }}
                                            onMouseEnter={(e) => e.target.style.opacity = '0.85'}
                                            onMouseLeave={(e) => e.target.style.opacity = '1'}
                                        >
                                            View Details
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                                        {searchTerm ? 'No patients match your search.' : 'No walk-in patients found.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {sortedPatients.length > 0 && (
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
                            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, sortedPatients.length)} of {sortedPatients.length} patients
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

export default WalkInPatients;
