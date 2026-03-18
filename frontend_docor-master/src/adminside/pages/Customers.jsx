import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import { cachedGet } from '../../services/apiCache';
import './Dashboard.css';

const Customers = () => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('id_desc');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const navigate = useNavigate();

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        try {
            const { data: response, fromCache } = await cachedGet('/customers');
            const data = response.data?.data || response.data || [];
            setCustomers(Array.isArray(data) ? data : []);
            if (fromCache) setLoading(false);
        } catch (error) {
            console.error('Error fetching customers:', error);
            setCustomers([]);
        } finally {
            setLoading(false);
        }
    };

    const filteredCustomers = customers.filter(c =>
        (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.phone || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.customer_code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.id && c.id.toString().includes(searchTerm))
    );

    const sortedCustomers = [...filteredCustomers].sort((a, b) => {
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

    const totalPages = Math.ceil(sortedCustomers.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedCustomers = sortedCustomers.slice(startIndex, startIndex + itemsPerPage);

    const handleSearch = (value) => {
        setSearchTerm(value);
        setCurrentPage(1);
    };

    if (loading) return <div className="dashboard-loading"><div className="spinner"></div></div>;

    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <h1>Customers</h1>
                <p className="dashboard-subtitle">Product-purchasing customers management</p>
            </div>

            <div style={{ marginBottom: '24px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                <input
                    type="text"
                    placeholder="Search by name, email, customer no., or contact..."
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
                                <th>Customer No.</th>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Contact No.</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedCustomers.length > 0 ? paginatedCustomers.map(customer => (
                                <tr key={customer.id}>
                                    <td style={{ fontWeight: '600', color: '#5D4E37' }}>
                                        {customer.customer_code || `#${customer.id}`}
                                    </td>
                                    <td>{customer.name}</td>
                                    <td>{customer.email || 'N/A'}</td>
                                    <td>{customer.phone || 'N/A'}</td>
                                    <td>
                                        <button
                                            onClick={() => navigate(`/admin/dashboard/customer-details/${customer.id}`)}
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
                                        {searchTerm ? 'No customers match your search.' : 'No customers found.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {sortedCustomers.length > 0 && (
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
                            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, sortedCustomers.length)} of {sortedCustomers.length} customers
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

export default Customers;
