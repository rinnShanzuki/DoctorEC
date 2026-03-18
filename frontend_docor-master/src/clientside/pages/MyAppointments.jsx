import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import clientAuthService from '../../services/clientAuthService';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import './MyAppointments.css';

const MyAppointments = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    // Modal states
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showRescheduleModal, setShowRescheduleModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [rescheduleDate, setRescheduleDate] = useState('');
    const [rescheduleTime, setRescheduleTime] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [actionMessage, setActionMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        fetchAppointments();
    }, [user, navigate]);

    const fetchAppointments = async () => {
        try {
            setLoading(true);
            const data = await clientAuthService.getAppointments();
            setAppointments(data);
        } catch (error) {
            console.error('Error fetching appointments:', error);
        } finally {
            setLoading(false);
        }
    };

    const getFilteredAppointments = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        switch (filter) {
            case 'upcoming':
                return appointments.filter(apt => new Date(apt.date) >= today && apt.status !== 'cancelled');
            case 'past':
                return appointments.filter(apt => new Date(apt.date) < today || apt.status === 'completed');
            case 'cancelled':
                return appointments.filter(apt => apt.status === 'cancelled');
            default:
                return appointments;
        }
    };

    const getStatusBadge = (status) => {
        const statusStyles = {
            confirmed: { backgroundColor: '#4CAF50', color: 'white' },
            approved: { backgroundColor: '#4CAF50', color: 'white' },
            pending: { backgroundColor: '#FF9800', color: 'white' },
            completed: { backgroundColor: '#2196F3', color: 'white' },
            cancelled: { backgroundColor: '#F44336', color: 'white' },
            ongoing: { backgroundColor: '#9C27B0', color: 'white' }
        };

        const displayStatus = status === 'confirmed' ? 'Approved' : status.charAt(0).toUpperCase() + status.slice(1);

        return (
            <span className="status-badge" style={statusStyles[status?.toLowerCase()] || {}}>
                {displayStatus}
            </span>
        );
    };

    const handleAppointmentClick = (appointment) => {
        setSelectedAppointment(appointment);
        setShowDetailsModal(true);
    };

    const handleRescheduleClick = () => {
        setShowDetailsModal(false);
        setRescheduleDate(selectedAppointment?.date || '');
        setRescheduleTime(selectedAppointment?.time || '');
        setShowRescheduleModal(true);
    };

    const handleCancelClick = () => {
        setShowDetailsModal(false);
        setShowCancelModal(true);
    };

    const handleRescheduleSubmit = async () => {
        if (!rescheduleDate || !rescheduleTime) {
            setActionMessage({ type: 'error', text: 'Please select both date and time' });
            return;
        }

        try {
            setActionLoading(true);
            await clientAuthService.rescheduleAppointment(selectedAppointment.id, {
                date: rescheduleDate,
                time: rescheduleTime
            });
            setActionMessage({ type: 'success', text: 'Appointment rescheduled successfully!' });
            setShowRescheduleModal(false);
            fetchAppointments();
        } catch (error) {
            console.error('Reschedule error:', error);
            setActionMessage({ type: 'error', text: error.message || 'Failed to reschedule appointment' });
        } finally {
            setActionLoading(false);
        }
    };

    const handleCancelSubmit = async () => {
        try {
            setActionLoading(true);
            await clientAuthService.cancelAppointment(selectedAppointment.id);
            setActionMessage({ type: 'success', text: 'Appointment cancelled successfully!' });
            setShowCancelModal(false);
            fetchAppointments();
        } catch (error) {
            console.error('Cancel error:', error);
            setActionMessage({ type: 'error', text: error.message || 'Failed to cancel appointment' });
        } finally {
            setActionLoading(false);
        }
    };

    const closeAllModals = () => {
        setShowDetailsModal(false);
        setShowRescheduleModal(false);
        setShowCancelModal(false);
        setSelectedAppointment(null);
        setActionMessage({ type: '', text: '' });
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const canModifyAppointment = (appointment) => {
        const status = appointment.status?.toLowerCase();
        return status === 'pending' || status === 'confirmed' || status === 'approved';
    };

    const getMinDate = () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
    };

    if (loading) {
        return (
            <>
                <Navbar />
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p>Loading your appointments...</p>
                </div>
                <Footer />
            </>
        );
    }

    const filteredAppointments = getFilteredAppointments();

    return (
        <>
            <Navbar />
            <div className="my-appointments-container">
                <div className="appointments-header">
                    <h1>My Appointments</h1>
                    <p>View and manage your scheduled appointments</p>
                </div>

                {actionMessage.text && (
                    <div className={`action-message ${actionMessage.type}`}>
                        {actionMessage.text}
                        <button onClick={() => setActionMessage({ type: '', text: '' })}>×</button>
                    </div>
                )}

                <div className="appointments-filters">
                    <button
                        className={filter === 'all' ? 'filter-btn active' : 'filter-btn'}
                        onClick={() => setFilter('all')}
                    >
                        All
                    </button>
                    <button
                        className={filter === 'upcoming' ? 'filter-btn active' : 'filter-btn'}
                        onClick={() => setFilter('upcoming')}
                    >
                        Upcoming
                    </button>
                    <button
                        className={filter === 'past' ? 'filter-btn active' : 'filter-btn'}
                        onClick={() => setFilter('past')}
                    >
                        Past
                    </button>
                    <button
                        className={filter === 'cancelled' ? 'filter-btn active' : 'filter-btn'}
                        onClick={() => setFilter('cancelled')}
                    >
                        Cancelled
                    </button>
                </div>

                <div className="appointments-list">
                    {filteredAppointments.length > 0 ? (
                        filteredAppointments.map(appointment => (
                            <div
                                key={appointment.id}
                                className="appointment-card clickable"
                                onClick={() => handleAppointmentClick(appointment)}
                            >
                                <div className="appointment-date">
                                    <div className="date-icon">📅</div>
                                    <div>
                                        <p className="date">{formatDate(appointment.date)}</p>
                                        <p className="time">{appointment.time}</p>
                                    </div>
                                </div>
                                <div className="appointment-details">
                                    <h3>{appointment.service}</h3>
                                    <p><strong>Doctor:</strong> {appointment.doctor}</p>
                                    {appointment.notes && <p style={{ whiteSpace: 'pre-wrap' }}><strong>Notes:</strong> {appointment.notes}</p>}
                                </div>
                                <div className="appointment-status">
                                    {getStatusBadge(appointment.status)}
                                    <span className="click-hint">Click for details</span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="empty-state">
                            <div className="empty-icon">📭</div>
                            <h3>No appointments found</h3>
                            <p>You don't have any {filter !== 'all' ? filter : ''} appointments yet.</p>
                            <button className="book-btn" onClick={() => navigate('/client-appointments')}>
                                Book an Appointment
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Details Modal */}
            {showDetailsModal && selectedAppointment && (
                <div className="modal-overlay" onClick={closeAllModals}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="modal-close" onClick={closeAllModals}>×</button>
                        <h2>Appointment Details</h2>

                        <div className="modal-details">
                            <div className="detail-row">
                                <span className="detail-label">Service:</span>
                                <span className="detail-value">{selectedAppointment.service}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Doctor:</span>
                                <span className="detail-value">{selectedAppointment.doctor || 'Not assigned'}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Date:</span>
                                <span className="detail-value">{formatDate(selectedAppointment.date)}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Time:</span>
                                <span className="detail-value">{selectedAppointment.time}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Type:</span>
                                <span className="detail-value">{selectedAppointment.type || 'In-person'}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Status:</span>
                                <span className="detail-value">{getStatusBadge(selectedAppointment.status)}</span>
                            </div>
                            {selectedAppointment.notes && (
                                <div className="detail-row notes">
                                    <span className="detail-label">Notes:</span>
                                    <span className="detail-value">{selectedAppointment.notes}</span>
                                </div>
                            )}
                        </div>

                        {canModifyAppointment(selectedAppointment) && (
                            <div className="modal-actions">
                                <button className="reschedule-btn" onClick={handleRescheduleClick}>
                                    📅 Reschedule
                                </button>
                                <button className="cancel-btn" onClick={handleCancelClick}>
                                    ❌ Cancel Appointment
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Reschedule Modal */}
            {showRescheduleModal && selectedAppointment && (
                <div className="modal-overlay" onClick={closeAllModals}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="modal-close" onClick={closeAllModals}>×</button>
                        <h2>Reschedule Appointment</h2>

                        <div className="reschedule-form">
                            <div className="form-group">
                                <label>New Date</label>
                                <input
                                    type="date"
                                    value={rescheduleDate}
                                    onChange={(e) => setRescheduleDate(e.target.value)}
                                    min={getMinDate()}
                                />
                            </div>
                            <div className="form-group">
                                <label>New Time</label>
                                <input
                                    type="time"
                                    value={rescheduleTime}
                                    onChange={(e) => setRescheduleTime(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="modal-actions">
                            <button className="cancel-action-btn" onClick={closeAllModals}>
                                Cancel
                            </button>
                            <button
                                className="confirm-btn"
                                onClick={handleRescheduleSubmit}
                                disabled={actionLoading}
                            >
                                {actionLoading ? 'Rescheduling...' : 'Confirm Reschedule'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Cancel Confirmation Modal */}
            {showCancelModal && selectedAppointment && (
                <div className="modal-overlay" onClick={closeAllModals}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="modal-close" onClick={closeAllModals}>×</button>
                        <h2>Cancel Appointment</h2>

                        <div className="cancel-warning">
                            <div className="warning-icon">⚠️</div>
                            <p>Are you sure you want to cancel this appointment?</p>
                            <div className="appointment-summary">
                                <p><strong>{selectedAppointment.service}</strong></p>
                                <p>{formatDate(selectedAppointment.date)} at {selectedAppointment.time}</p>
                            </div>
                            <p className="warning-text">This action cannot be undone.</p>
                        </div>

                        <div className="modal-actions">
                            <button className="cancel-action-btn" onClick={closeAllModals}>
                                Keep Appointment
                            </button>
                            <button
                                className="confirm-cancel-btn"
                                onClick={handleCancelSubmit}
                                disabled={actionLoading}
                            >
                                {actionLoading ? 'Cancelling...' : 'Yes, Cancel Appointment'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <Footer />
        </>
    );
};

export default MyAppointments;
