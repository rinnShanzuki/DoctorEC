import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import clientAuthService from '../../services/clientAuthService';
import './MyReservations.css';

const MyReservations = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, Pending, Accepted, In Process, Fulfilled, Cancelled

    // Modal states
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showRescheduleModal, setShowRescheduleModal] = useState(false);
    const [selectedReservation, setSelectedReservation] = useState(null);
    const [newPickupDate, setNewPickupDate] = useState('');

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        fetchReservations();
    }, [user, navigate]);

    const fetchReservations = async () => {
        try {
            setLoading(true);
            const data = await clientAuthService.getReservations();
            setReservations(data);
        } catch (error) {
            console.error('Error fetching reservations:', error);
        } finally {
            setLoading(false);
        }
    };

    const getFilteredReservations = () => {
        if (filter === 'all') return reservations;
        return reservations.filter(res => res.status === filter);
    };

    const getStatusBadge = (status) => {
        const statusStyles = {
            'Pending': { backgroundColor: '#FF9800', color: 'white' },
            'Accepted': { backgroundColor: '#2196F3', color: 'white' },
            'In Process': { backgroundColor: '#9C27B0', color: 'white' },
            'Fulfilled': { backgroundColor: '#4CAF50', color: 'white' },
            'Cancelled': { backgroundColor: '#F44336', color: 'white' }
        };

        return (
            <span className="status-badge" style={statusStyles[status] || {}}>
                {status}
            </span>
        );
    };

    const handleViewDetails = (reservation) => {
        setSelectedReservation(reservation);
        setShowDetailsModal(true);
    };

    const handleReschedule = (reservation) => {
        setSelectedReservation(reservation);
        setNewPickupDate(reservation.pickup_date || '');
        setShowRescheduleModal(true);
    };

    const handleConfirmReschedule = async () => {
        try {
            await clientAuthService.reschedulePickup(selectedReservation.id, newPickupDate);
            setShowRescheduleModal(false);
            alert('Pickup date rescheduled successfully!');
            fetchReservations();
        } catch (error) {
            alert('Failed to reschedule: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleCancelReservation = async (id) => {
        if (window.confirm('Are you sure you want to cancel this reservation?')) {
            try {
                await clientAuthService.cancelReservation(id);
                alert('Reservation cancelled successfully');
                fetchReservations();
            } catch (error) {
                alert('Failed to cancel: ' + (error.response?.data?.message || error.message));
            }
        }
    };

    if (loading) {
        return (
            <>
                <Navbar />
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p>Loading your reservations...</p>
                </div>
                <Footer />
            </>
        );
    }

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to remove this reservation? This action cannot be undone.')) {
            try {
                setLoading(true);
                await clientAuthService.deleteReservation(id);
                // Refresh list
                await fetchReservations();
                alert('Reservation removed successfully');
            } catch (error) {
                console.error('Error removing reservation:', error);
                alert('Failed to remove reservation: ' + (error.message || 'Unknown error'));
            } finally {
                setLoading(false);
            }
        }
    };

    const filteredReservations = getFilteredReservations();

    return (
        <>
            <Navbar />
            <div className="my-reservations-container">
                <div className="reservations-header">
                    <h1>My Reservations</h1>
                    <p>View and manage your product reservations</p>
                </div>

                <div className="reservations-filters">
                    <button
                        className={filter === 'all' ? 'filter-btn active' : 'filter-btn'}
                        onClick={() => setFilter('all')}
                    >
                        All
                    </button>
                    <button
                        className={filter === 'Pending' ? 'filter-btn active' : 'filter-btn'}
                        onClick={() => setFilter('Pending')}
                    >
                        Pending
                    </button>
                    <button
                        className={filter === 'Accepted' ? 'filter-btn active' : 'filter-btn'}
                        onClick={() => setFilter('Accepted')}
                    >
                        Accepted
                    </button>
                    <button
                        className={filter === 'In Process' ? 'filter-btn active' : 'filter-btn'}
                        onClick={() => setFilter('In Process')}
                    >
                        In Process
                    </button>
                    <button
                        className={filter === 'Fulfilled' ? 'filter-btn active' : 'filter-btn'}
                        onClick={() => setFilter('Fulfilled')}
                    >
                        Fulfilled
                    </button>
                    <button
                        className={filter === 'Cancelled' ? 'filter-btn active' : 'filter-btn'}
                        onClick={() => setFilter('Cancelled')}
                    >
                        Cancelled
                    </button>
                </div>

                <div className="reservations-list">
                    {filteredReservations.length > 0 ? (
                        filteredReservations.map(reservation => (
                            <div key={reservation.id} className="reservation-card">
                                <div className="reservation-image">
                                    <img src={reservation.image} alt={reservation.product} />
                                </div>
                                <div className="reservation-details">
                                    <h3>{reservation.product}</h3>
                                    <p><strong>Price:</strong> ₱{parseFloat(reservation.price || 0).toFixed(2)}</p>
                                    <p><strong>Reserved on:</strong> {new Date(reservation.date).toLocaleDateString()}</p>
                                    {reservation.pickup_date && (
                                        <p><strong>Pickup Date:</strong> {new Date(reservation.pickup_date).toLocaleDateString()}</p>
                                    )}
                                    {reservation.payment_mode && (
                                        <p><strong>Payment Mode:</strong> {reservation.payment_mode}</p>
                                    )}
                                </div>
                                <div className="reservation-status" style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
                                    {getStatusBadge(reservation.status)}
                                    <button
                                        onClick={() => handleViewDetails(reservation)}
                                        style={{
                                            padding: '8px 15px',
                                            backgroundColor: '#5D4E37',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '5px',
                                            cursor: 'pointer',
                                            fontSize: '0.85rem',
                                            fontWeight: '600'
                                        }}
                                    >
                                        View Details
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="empty-state">
                            <div className="empty-icon">🛒</div>
                            <h3>No reservations found</h3>
                            <p>You don't have any {filter !== 'all' ? filter : ''} reservations yet.</p>
                            <button className="browse-btn" onClick={() => navigate('/products')}>
                                Browse Products
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* View Details Modal */}
            {showDetailsModal && selectedReservation && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        padding: '30px',
                        borderRadius: '10px',
                        maxWidth: '500px',
                        width: '90%',
                        maxHeight: '80vh',
                        overflowY: 'auto'
                    }}>
                        <h2 style={{ marginBottom: '20px' }}>Reservation Details</h2>
                        <div style={{ marginBottom: '15px' }}>
                            <img src={selectedReservation.image} alt={selectedReservation.product} style={{ width: '100%', borderRadius: '8px', marginBottom: '15px' }} />
                            <p><strong>Product:</strong> {selectedReservation.product}</p>
                            <p><strong>Price:</strong> ₱{parseFloat(selectedReservation.price || 0).toFixed(2)}</p>
                            <p><strong>Status:</strong> {selectedReservation.status}</p>
                            <p><strong>Reserved on:</strong> {new Date(selectedReservation.date).toLocaleDateString()}</p>
                            {selectedReservation.pickup_date && (
                                <p><strong>Pickup Date:</strong> {new Date(selectedReservation.pickup_date).toLocaleDateString()}</p>
                            )}
                            {selectedReservation.payment_mode && (
                                <p><strong>Payment Mode:</strong> {selectedReservation.payment_mode}</p>
                            )}
                            {selectedReservation.message && (
                                <p><strong>Message:</strong> {selectedReservation.message}</p>
                            )}
                        </div>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                            {(selectedReservation.status === 'Pending' || selectedReservation.status === 'Accepted') && (
                                <button
                                    onClick={() => {
                                        setShowDetailsModal(false);
                                        handleReschedule(selectedReservation);
                                    }}
                                    style={{
                                        flex: 1,
                                        padding: '10px',
                                        backgroundColor: '#2196F3',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '5px',
                                        cursor: 'pointer',
                                        fontWeight: '600'
                                    }}
                                >
                                    Reschedule Pickup
                                </button>
                            )}
                            {selectedReservation.status !== 'Fulfilled' && selectedReservation.status !== 'Cancelled' && (
                                <button
                                    onClick={() => {
                                        setShowDetailsModal(false);
                                        handleCancelReservation(selectedReservation.id);
                                    }}
                                    style={{
                                        flex: 1,
                                        padding: '10px',
                                        backgroundColor: '#F44336',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '5px',
                                        cursor: 'pointer',
                                        fontWeight: '600'
                                    }}
                                >
                                    Cancel Reservation
                                </button>
                            )}
                            <button
                                onClick={() => setShowDetailsModal(false)}
                                style={{
                                    flex: 1,
                                    padding: '10px',
                                    backgroundColor: '#666',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '5px',
                                    cursor: 'pointer',
                                    fontWeight: '600'
                                }}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reschedule Modal */}
            {showRescheduleModal && selectedReservation && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        padding: '30px',
                        borderRadius: '10px',
                        maxWidth: '400px',
                        width: '90%'
                    }}>
                        <h2 style={{ marginBottom: '20px' }}>Reschedule Pickup</h2>
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                                New Pickup Date <span style={{ color: 'red' }}>*</span>
                            </label>
                            <input
                                type="date"
                                value={newPickupDate}
                                min={(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })()}
                                onChange={(e) => setNewPickupDate(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    border: '1px solid #ddd',
                                    borderRadius: '5px',
                                    fontSize: '14px'
                                }}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                                onClick={() => setShowRescheduleModal(false)}
                                style={{
                                    flex: 1,
                                    padding: '10px',
                                    backgroundColor: '#666',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '5px',
                                    cursor: 'pointer',
                                    fontWeight: '600'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmReschedule}
                                disabled={!newPickupDate}
                                style={{
                                    flex: 1,
                                    padding: '10px',
                                    backgroundColor: '#2196F3',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '5px',
                                    cursor: newPickupDate ? 'pointer' : 'not-allowed',
                                    opacity: newPickupDate ? 1 : 0.5,
                                    fontWeight: '600'
                                }}
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <Footer />
        </>
    );
};

export default MyReservations;
