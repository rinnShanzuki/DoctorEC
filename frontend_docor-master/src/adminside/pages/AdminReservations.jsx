import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { useNotification } from '../hooks/useNotification';
import './Dashboard.css';

const AdminReservations = () => {
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [showViewModal, setShowViewModal] = useState(false);
    const [currentReservation, setCurrentReservation] = useState(null);
    const { showNotification, NotificationModal } = useNotification();

    // Fetch Reservations
    useEffect(() => {
        fetchReservations();
    }, []);

    const fetchReservations = async () => {
        try {
            setLoading(true);
            const response = await adminAPI.getReservations();
            console.log('Reservations response:', response);

            // Handle response data structure
            const data = response.data || response;
            setReservations(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching reservations:', error);
            setReservations([]);
        } finally {
            setLoading(false);
        }
    };

    // Filter Logic
    const filteredReservations = reservations.filter(res => {
        const userName = res.user?.name || 'Unknown User';
        const productName = res.product?.name || 'Unknown Product';
        const searchString = searchTerm.toLowerCase();

        const matchesSearch = userName.toLowerCase().includes(searchString) ||
            productName.toLowerCase().includes(searchString) ||
            res.id.toString().includes(searchTerm);

        const matchesStatus = statusFilter === 'All' || res.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    // Handle Status Update
    const handleStatusUpdate = async (id, newStatus) => {
        try {
            await adminAPI.updateReservationStatus(id, newStatus);
            // Optimistic update
            setReservations(reservations.map(res =>
                res.id === id ? { ...res, status: newStatus } : res
            ));
            showNotification(`Reservation status updated to ${newStatus} successfully.`, 'success');
        } catch (error) {
            console.error('Error updating status:', error);
            showNotification('Failed to update status: ' + (error.response?.data?.message || error.message), 'error');
        }
    };

    // View reservation details
    const handleView = (reservation) => {
        setCurrentReservation({ ...reservation });
        setShowViewModal(true);
    };

    const handleUpdateStatus = async (newStatus) => {
        try {
            await adminAPI.updateReservationStatus(currentReservation.id, newStatus);
            setReservations(reservations.map(res =>
                res.id === currentReservation.id ? { ...res, status: newStatus } : res
            ));
            showNotification(`Reservation status updated to ${newStatus}`, 'success');
            setShowViewModal(false);
            fetchReservations();
        } catch (error) {
            console.error('Error updating status:', error);
            showNotification('Failed to update status.', 'error');
        }
    };

    if (loading) return <div className="dashboard-loading"><div className="spinner"></div></div>;

    return (
        <div className="dashboard">
            <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1>Reservations</h1>
                    <p className="dashboard-subtitle">Track product reservations</p>
                </div>
                {/* 
                <button
                    className="view-all-btn"
                    style={{ backgroundColor: '#5D4E37', color: 'white', padding: '10px 20px', fontSize: '12px' }}
                    onClick={handleAddNew}
                >
                    + Add New Reservation
                </button>
                */}
            </div>

            {/* Status Tabs */}
            <div style={{
                marginBottom: '24px',
                display: 'flex',
                gap: '10px',
                borderBottom: '2px solid #E0D5C7',
                paddingBottom: '10px'
            }}>
                {['All', 'Pending', 'Accepted', 'In Process', 'Fulfilled', 'Cancelled'].map(status => (
                    <button
                        key={status}
                        onClick={() => setStatusFilter(status)}
                        style={{
                            padding: '10px 20px',
                            border: 'none',
                            backgroundColor: statusFilter === status ? '#5D4E37' : 'transparent',
                            color: statusFilter === status ? 'white' : '#5D4E37',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: statusFilter === status ? 'bold' : 'normal',
                            fontSize: '14px',
                            transition: 'all 0.3s ease'
                        }}
                    >
                        {status}
                    </button>
                ))}
            </div>

            {/* Search */}
            <div style={{ marginBottom: '24px' }}>
                <input
                    type="text"
                    placeholder="Search by customer or product..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
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
                    <h3>All Reservations</h3>
                </div>
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Customer</th>
                                <th>Product</th>
                                <th>Pickup Date</th>
                                <th>Payment Mode</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredReservations.length > 0 ? (
                                filteredReservations.map(res => (
                                    <tr key={res.id}>
                                        <td>#{res.id}</td>
                                        <td>
                                            <div style={{ fontWeight: 'bold' }}>{res.user?.name || 'Unknown'}</div>
                                            <div style={{ fontSize: '11px', color: '#666' }}>{res.user?.email}</div>
                                        </td>
                                        <td>
                                            <div>{res.product?.name || 'Unknown Item'}</div>
                                            <div style={{ fontSize: '11px', color: '#666' }}>₱{Number(res.product?.price || 0).toLocaleString()}</div>
                                        </td>
                                        <td>{res.pickup_date ? new Date(res.pickup_date).toLocaleDateString() : 'N/A'}</td>
                                        <td>{res.payment_mode || 'N/A'}</td>
                                        <td>
                                            <span className={`status-badge 
                                                ${res.status === 'Fulfilled' ? 'status-completed' :
                                                    res.status === 'Cancelled' ? 'status-cancelled' :
                                                        res.status === 'In Process' ? 'status-pending' :
                                                            res.status === 'Accepted' ? 'status-confirmed' : 'status-pending'}`
                                            }>
                                                {res.status}
                                            </span>
                                        </td>
                                        <td>
                                            <button
                                                onClick={() => handleView(res)}
                                                style={{
                                                    padding: '6px 12px',
                                                    fontSize: '12px',
                                                    backgroundColor: '#5D4E37',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    fontWeight: '600'
                                                }}
                                                title="View Details"
                                            >
                                                View
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className="no-data">No reservations found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* View/Manage Reservation Modal */}
            {showViewModal && currentReservation && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '600px', textAlign: 'left' }}>
                        <h3 style={{ marginBottom: '20px', borderBottom: '2px solid #E0D5C7', paddingBottom: '10px' }}>
                            Reservation Details #{currentReservation.id}
                        </h3>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                            <div>
                                <strong style={{ display: 'block', marginBottom: '5px', color: '#5D4E37' }}>Customer:</strong>
                                <div>{currentReservation.user?.name || 'Unknown'}</div>
                                <div style={{ fontSize: '12px', color: '#666' }}>{currentReservation.user?.email}</div>
                            </div>

                            <div>
                                <strong style={{ display: 'block', marginBottom: '5px', color: '#5D4E37' }}>Product:</strong>
                                <div>{currentReservation.product?.name || 'Unknown'}</div>
                                <div style={{ fontSize: '12px', color: '#666' }}>₱{Number(currentReservation.product?.price || 0).toLocaleString()}</div>
                            </div>

                            <div>
                                <strong style={{ display: 'block', marginBottom: '5px', color: '#5D4E37' }}>Pickup Date:</strong>
                                <div>{currentReservation.pickup_date ? new Date(currentReservation.pickup_date).toLocaleDateString() : 'N/A'}</div>
                            </div>

                            <div>
                                <strong style={{ display: 'block', marginBottom: '5px', color: '#5D4E37' }}>Payment Mode:</strong>
                                <div>{currentReservation.payment_mode || 'N/A'}</div>
                            </div>

                            <div>
                                <strong style={{ display: 'block', marginBottom: '5px', color: '#5D4E37' }}>Reserved On:</strong>
                                <div>{new Date(currentReservation.created_at).toLocaleDateString()}</div>
                            </div>

                            <div>
                                <strong style={{ display: 'block', marginBottom: '5px', color: '#5D4E37' }}>Current Status:</strong>
                                <div>
                                    <span className={`status-badge 
                                        ${currentReservation.status === 'Fulfilled' ? 'status-completed' :
                                            currentReservation.status === 'Cancelled' ? 'status-cancelled' :
                                                currentReservation.status === 'In Process' ? 'status-pending' :
                                                    currentReservation.status === 'Accepted' ? 'status-confirmed' : 'status-pending'}`
                                    }>
                                        {currentReservation.status}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {currentReservation.message && (
                            <div style={{ marginBottom: '20px' }}>
                                <strong style={{ display: 'block', marginBottom: '5px', color: '#5D4E37' }}>Customer Message:</strong>
                                <div style={{ padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '4px', fontSize: '14px' }}>
                                    {currentReservation.message}
                                </div>
                            </div>
                        )}

                        <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #E0D5C7' }}>
                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                                {currentReservation.status === 'Pending' && (
                                    <>
                                        <button
                                            onClick={() => handleUpdateStatus('Accepted')}
                                            style={{
                                                padding: '10px 30px',
                                                backgroundColor: '#4CAF50',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                fontSize: '14px',
                                                fontWeight: '600',
                                                minWidth: '120px'
                                            }}
                                        >
                                            Accept
                                        </button>
                                        <button
                                            onClick={() => handleUpdateStatus('Cancelled')}
                                            style={{
                                                padding: '10px 30px',
                                                backgroundColor: '#F44336',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                fontSize: '14px',
                                                fontWeight: '600',
                                                minWidth: '120px'
                                            }}
                                        >
                                            Reject
                                        </button>
                                    </>
                                )}
                                {currentReservation.status === 'Accepted' && (
                                    <button
                                        onClick={() => handleUpdateStatus('In Process')}
                                        style={{
                                            padding: '10px 30px',
                                            backgroundColor: '#9C27B0',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            fontSize: '14px',
                                            fontWeight: '600',
                                            minWidth: '120px'
                                        }}
                                    >
                                        Mark In Process
                                    </button>
                                )}
                                {currentReservation.status === 'In Process' && (
                                    <button
                                        onClick={() => handleUpdateStatus('Fulfilled')}
                                        style={{
                                            padding: '10px 30px',
                                            backgroundColor: '#4CAF50',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            fontSize: '14px',
                                            fontWeight: '600',
                                            minWidth: '120px'
                                        }}
                                    >
                                        Mark Fulfilled
                                    </button>
                                )}
                                {(currentReservation.status === 'Fulfilled' || currentReservation.status === 'Cancelled') && (
                                    <p style={{ textAlign: 'center', color: '#666', fontStyle: 'italic' }}>
                                        No actions available for {currentReservation.status.toLowerCase()} reservations
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="modal-actions" style={{ marginTop: '20px' }}>
                            <button
                                type="button"
                                className="modal-btn cancel"
                                onClick={() => setShowViewModal(false)}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {NotificationModal}
        </div>
    );
};

export default AdminReservations;
