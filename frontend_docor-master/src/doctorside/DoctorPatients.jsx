import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { FaUser, FaSearch, FaEye, FaGlobe, FaWalking } from 'react-icons/fa';
import './DoctorLayout.css';

const DoctorPatients = () => {
    const navigate = useNavigate();
    const [patients, setPatients] = useState([]);
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('walk-in');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('id_asc');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [patientsRes, clientsRes] = await Promise.all([
                api.get('/doctor/patients'),
                api.get('/doctor/clients'),
            ]);
            const pData = patientsRes.data?.data || patientsRes.data || [];
            const walkIn = Array.isArray(pData) ? pData.filter(p => !p.client_id) : [];
            setPatients(walkIn);

            const cData = clientsRes.data?.data || clientsRes.data || [];
            setClients(Array.isArray(cData) ? cData : []);
        } catch (error) {
            console.error('Error fetching patients:', error);
        } finally {
            setLoading(false);
        }
    };

    const currentList = activeTab === 'walk-in' ? patients : clients;

    // Search
    const filtered = currentList.filter(p => {
        const term = searchTerm.toLowerCase();
        const name = (p.name || `${p.first_name || ''} ${p.last_name || ''}`).toLowerCase();
        return name.includes(term) ||
            (p.email || '').toLowerCase().includes(term) ||
            (p.patient_code || '').toLowerCase().includes(term) ||
            (p.phone || '').toLowerCase().includes(term);
    });

    // Sort
    const sorted = [...filtered].sort((a, b) => {
        const nameA = a.name || `${a.first_name || ''} ${a.last_name || ''}`;
        const nameB = b.name || `${b.first_name || ''} ${b.last_name || ''}`;
        switch (sortBy) {
            case 'id_asc': return (a.id || a.patient_id || a.client_id || 0) - (b.id || b.patient_id || b.client_id || 0);
            case 'id_desc': return (b.id || b.patient_id || b.client_id || 0) - (a.id || a.patient_id || a.client_id || 0);
            case 'name_asc': return nameA.localeCompare(nameB);
            case 'name_desc': return nameB.localeCompare(nameA);
            default: return 0;
        }
    });

    const totalPages = Math.ceil(sorted.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginated = sorted.slice(startIndex, startIndex + itemsPerPage);

    const handleSearch = (value) => {
        setSearchTerm(value);
        setCurrentPage(1);
    };

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setSearchTerm('');
        setCurrentPage(1);
    };

    const handleView = (item) => {
        if (activeTab === 'walk-in') {
            navigate(`/doctor/patients/${item.id || item.patient_id}`, { state: { type: 'patient' } });
        } else {
            navigate(`/doctor/patients/client-${item.client_id}`, { state: { type: 'client' } });
        }
    };

    const fontStyle = { fontFamily: 'Calibri, sans-serif' };
    const tabStyle = (isActive) => ({
        padding: '10px 24px',
        borderRadius: '8px 8px 0 0',
        border: 'none',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '600',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        backgroundColor: isActive ? '#5D4E37' : '#F0EAE2',
        color: isActive ? 'white' : '#5D4E37',
        transition: 'all 0.2s ease',
    });

    if (loading) {
        return (
            <div style={{ ...fontStyle, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <div style={{
                    width: 40, height: 40,
                    border: '4px solid #E0D5C7', borderTopColor: '#5D4E37',
                    borderRadius: '50%', animation: 'spin 0.8s linear infinite'
                }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <div style={fontStyle}>
            {/* Page Header */}
            <div className="page-header">
                <div>
                    <h1>Patients</h1>
                    <div className="breadcrumb">Doctor Portal &gt; Patients</div>
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '4px', marginBottom: 0 }}>
                <button style={tabStyle(activeTab === 'walk-in')} onClick={() => handleTabChange('walk-in')}>
                    <FaWalking /> Walk-in Patients
                </button>
                <button style={tabStyle(activeTab === 'online')} onClick={() => handleTabChange('online')}>
                    <FaGlobe /> Online Clients
                </button>
            </div>

            {/* Content Area */}
            <div style={{
                backgroundColor: 'white', borderRadius: '0 12px 12px 12px',
                padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                border: '1px solid #F0EAE2'
            }}>
                {/* Search & Sort */}
                <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', alignItems: 'center' }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                        <FaSearch style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
                        <input
                            type="text"
                            placeholder={`Search ${activeTab === 'walk-in' ? 'patients' : 'clients'} by name, email, or contact...`}
                            value={searchTerm}
                            onChange={(e) => handleSearch(e.target.value)}
                            style={{
                                width: '100%', padding: '12px 12px 12px 40px', borderRadius: '8px',
                                border: '1.5px solid #E0D5C7', fontSize: '14px',
                                fontFamily: 'Calibri, sans-serif', outline: 'none',
                                boxSizing: 'border-box', transition: 'border-color 0.2s',
                                backgroundColor: '#FDFAF7'
                            }}
                        />
                    </div>
                    <select
                        value={sortBy}
                        onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}
                        style={{
                            padding: '12px 16px', borderRadius: '8px', border: '1.5px solid #E0D5C7',
                            fontFamily: 'Calibri, sans-serif', fontSize: '14px',
                            backgroundColor: 'white', color: '#5D4E37', cursor: 'pointer',
                            minWidth: '180px', fontWeight: '500'
                        }}
                    >
                        <option value="id_asc">Sort by ID ↑</option>
                        <option value="id_desc">Sort by ID ↓</option>
                        <option value="name_asc">Sort by Name A–Z</option>
                        <option value="name_desc">Sort by Name Z–A</option>
                    </select>
                </div>

                {/* Table */}
                <div style={{ overflowX: 'auto' }}>
                    <table style={{
                        width: '100%', borderCollapse: 'collapse', fontSize: '14px'
                    }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #E0D5C7', textAlign: 'left' }}>
                                <th style={{ padding: '12px 10px', color: '#5D4E37', fontWeight: '700', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    {activeTab === 'walk-in' ? 'Patient No.' : 'Account No.'}
                                </th>
                                <th style={{ padding: '12px 10px', color: '#5D4E37', fontWeight: '700', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Name</th>
                                <th style={{ padding: '12px 10px', color: '#5D4E37', fontWeight: '700', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email</th>
                                <th style={{ padding: '12px 10px', color: '#5D4E37', fontWeight: '700', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Contact No.</th>
                                <th style={{ padding: '12px 10px', color: '#5D4E37', fontWeight: '700', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginated.length > 0 ? paginated.map((item, idx) => {
                                const id = activeTab === 'walk-in'
                                    ? (item.patient_code || `P-${item.id || item.patient_id}`)
                                    : `#${item.client_id}`;
                                const name = item.name || `${item.first_name || ''} ${item.last_name || ''}`.trim();
                                return (
                                    <tr key={idx} style={{ borderBottom: '1px solid #F0EAE2', transition: 'background-color 0.15s' }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FDFAF7'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                    >
                                        <td style={{ padding: '14px 10px', fontWeight: '600', color: '#5D4E37' }}>{id}</td>
                                        <td style={{ padding: '14px 10px', fontWeight: '500' }}>{name}</td>
                                        <td style={{ padding: '14px 10px', color: '#666' }}>{item.email || 'N/A'}</td>
                                        <td style={{ padding: '14px 10px', color: '#666' }}>{item.phone || 'N/A'}</td>
                                        <td style={{ padding: '14px 10px' }}>
                                            <button
                                                onClick={() => handleView(item)}
                                                style={{
                                                    background: 'linear-gradient(135deg, #5D4E37, #8B7355)',
                                                    color: 'white', border: 'none', padding: '8px 18px',
                                                    borderRadius: '6px', cursor: 'pointer', fontSize: '13px',
                                                    fontWeight: '600', display: 'inline-flex', alignItems: 'center',
                                                    gap: '6px', transition: 'opacity 0.2s'
                                                }}
                                                onMouseEnter={(e) => e.target.style.opacity = '0.85'}
                                                onMouseLeave={(e) => e.target.style.opacity = '1'}
                                            >
                                                <FaEye /> View
                                            </button>
                                        </td>
                                    </tr>
                                );
                            }) : (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#999', fontStyle: 'italic' }}>
                                        {searchTerm
                                            ? `No ${activeTab === 'walk-in' ? 'patients' : 'clients'} match your search.`
                                            : `No ${activeTab === 'walk-in' ? 'walk-in patients' : 'online clients'} found.`
                                        }
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {sorted.length > itemsPerPage && (
                    <div style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        marginTop: '20px', padding: '15px', backgroundColor: '#FDFAF7', borderRadius: '8px'
                    }}>
                        <span style={{ color: '#666', fontSize: '13px' }}>
                            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, sorted.length)} of {sorted.length}
                        </span>
                        <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                style={{
                                    padding: '8px 14px', borderRadius: '6px', border: '1px solid #E0D5C7',
                                    backgroundColor: currentPage === 1 ? '#f0f0f0' : 'white',
                                    color: currentPage === 1 ? '#999' : '#5D4E37',
                                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontWeight: '600', fontSize: '13px'
                                }}
                            >
                                ← Prev
                            </button>
                            {[...Array(totalPages)].map((_, i) => (
                                <button
                                    key={i + 1}
                                    onClick={() => setCurrentPage(i + 1)}
                                    style={{
                                        padding: '8px 12px', borderRadius: '6px',
                                        border: currentPage === i + 1 ? 'none' : '1px solid #E0D5C7',
                                        backgroundColor: currentPage === i + 1 ? '#5D4E37' : 'white',
                                        color: currentPage === i + 1 ? 'white' : '#5D4E37',
                                        cursor: 'pointer', fontWeight: currentPage === i + 1 ? '700' : '500', fontSize: '13px'
                                    }}
                                >
                                    {i + 1}
                                </button>
                            ))}
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                style={{
                                    padding: '8px 14px', borderRadius: '6px', border: '1px solid #E0D5C7',
                                    backgroundColor: currentPage === totalPages ? '#f0f0f0' : 'white',
                                    color: currentPage === totalPages ? '#999' : '#5D4E37',
                                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', fontWeight: '600', fontSize: '13px'
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

export default DoctorPatients;
