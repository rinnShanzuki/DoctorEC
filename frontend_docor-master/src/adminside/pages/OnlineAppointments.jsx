import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { cachedGet, invalidateCache } from '../../services/apiCache';
import { useNotification } from '../hooks/useNotification';
import './AppointmentPage.css';

const OnlineAppointments = () => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [dateFilter, setDateFilter] = useState('');
    const [doctorFilter, setDoctorFilter] = useState('');
    const [doctors, setDoctors] = useState([]);

    // View Modal
    const [showViewModal, setShowViewModal] = useState(false);
    const [currentAppointment, setCurrentAppointment] = useState(null);

    const { showNotification, NotificationModal } = useNotification();
    const statusTabs = ['All', 'Pending', 'Approved', 'Completed', 'Cancelled'];

    useEffect(() => {
        fetchAppointments();
        fetchDoctors();
    }, []);

    const fetchAppointments = async () => {
        try {
            const { data: response, fromCache } = await cachedGet('/appointments');
            const data = response.data.data || response.data || [];
            // Online = appointments booked by clients through the website (has clientAccount)
            const online = data.filter(a => a.clientAccount);
            setAppointments(online);
            if (fromCache) setLoading(false);
        } catch (error) {
            console.error('Error fetching appointments:', error);
            setAppointments([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchDoctors = async () => {
        try {
            const { data: res } = await cachedGet('/doctors');
            setDoctors(res.data?.data || res.data || []);
        } catch (error) {
            console.error('Error fetching doctors:', error);
        }
    };

    // Filter logic
    const filteredAppointments = appointments.filter(app => {
        const patientName = app.clientAccount
            ? `${app.clientAccount.first_name} ${app.clientAccount.last_name}`
            : (app.patient?.name || 'Unknown');
        const serviceName = app.service?.name || '';
        const doctorName = app.doctor?.full_name || '';
        const search = searchTerm.toLowerCase();

        const matchesSearch = !searchTerm ||
            patientName.toLowerCase().includes(search) ||
            serviceName.toLowerCase().includes(search) ||
            doctorName.toLowerCase().includes(search) ||
            app.appointment_id?.toString().includes(searchTerm);

        const matchesStatus = statusFilter === 'All' ||
            app.status?.toLowerCase() === statusFilter.toLowerCase();

        const matchesDate = !dateFilter || app.appointment_date === dateFilter;
        const matchesDoctor = !doctorFilter || app.doctor_id?.toString() === doctorFilter;

        return matchesSearch && matchesStatus && matchesDate && matchesDoctor;
    });

    const handleView = (appointment) => {
        setCurrentAppointment({ ...appointment });
        setShowViewModal(true);
    };

    const handleStatusUpdate = async (status) => {
        try {
            await adminAPI.updateAppointmentStatus(currentAppointment.appointment_id, status);
            showNotification(`Appointment ${status.toLowerCase()} successfully!`, 'success');
            setShowViewModal(false);
            fetchAppointments();
        } catch (error) {
            showNotification('Failed to update status: ' + (error.response?.data?.message || error.message), 'error');
        }
    };

    const getStatusClass = (status) => {
        const map = { Pending: 'ap-status-pending', Approved: 'ap-status-confirmed', Completed: 'ap-status-completed', Cancelled: 'ap-status-cancelled' };
        return map[status] || 'ap-status-pending';
    };

    const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    const formatTime = (t) => {
        if (!t) return '';
        const [h, m] = t.split(':');
        const hr = parseInt(h);
        return `${hr > 12 ? hr - 12 : hr}:${m} ${hr >= 12 ? 'PM' : 'AM'}`;
    };

    if (loading) return <div className="ap-loading"><div className="ap-spinner"></div><p>Loading appointments...</p></div>;

    return (
        <div className="ap-page">
            <div className="ap-header">
                <div>
                    <h1>Online Appointments</h1>
                    <p className="ap-subtitle">Manage appointments booked online by clients</p>
                </div>
            </div>

            {/* Filters Row */}
            <div className="ap-filters">
                <input
                    type="text"
                    className="ap-search"
                    placeholder="Search by patient, service, or doctor..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <input
                    type="date"
                    className="ap-filter-input"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                />
                <select
                    className="ap-filter-input"
                    value={doctorFilter}
                    onChange={(e) => setDoctorFilter(e.target.value)}
                >
                    <option value="">All Doctors</option>
                    {doctors.map(d => (
                        <option key={d.doctor_id} value={d.doctor_id}>{d.full_name}</option>
                    ))}
                </select>
                {(dateFilter || doctorFilter) && (
                    <button className="ap-btn ap-btn-ghost" onClick={() => { setDateFilter(''); setDoctorFilter(''); }}>
                        Clear Filters
                    </button>
                )}
            </div>

            {/* Status Tabs */}
            <div className="ap-tabs">
                {statusTabs.map(tab => (
                    <button
                        key={tab}
                        className={`ap-tab ${statusFilter === tab ? 'ap-tab-active' : ''}`}
                        onClick={() => setStatusFilter(tab)}
                    >
                        {tab}
                        <span className="ap-tab-count">
                            {tab === 'All' ? appointments.length :
                                appointments.filter(a => a.status?.toLowerCase() === tab.toLowerCase()).length}
                        </span>
                    </button>
                ))}
            </div>

            {/* Appointments Table */}
            <div className="ap-table-card">
                <div className="ap-table-scroll">
                    <table className="ap-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Client</th>
                                <th>Service</th>
                                <th>Doctor</th>
                                <th>Date & Time</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAppointments.length > 0 ? (
                                filteredAppointments.map(app => {
                                    const clientName = app.clientAccount
                                        ? `${app.clientAccount.first_name} ${app.clientAccount.last_name}`
                                        : 'Unknown Client';
                                    return (
                                        <tr key={app.appointment_id}>
                                            <td className="ap-id">#{app.appointment_id}</td>
                                            <td>{clientName}</td>
                                            <td>{app.service?.name || 'N/A'}</td>
                                            <td>{app.doctor?.full_name || 'Unassigned'}</td>
                                            <td>
                                                <span className="ap-date">{formatDate(app.appointment_date)}</span>
                                                <span className="ap-time">{formatTime(app.appointment_time)}</span>
                                            </td>
                                            <td>
                                                <span className={`ap-status-badge ${getStatusClass(app.status)}`}>
                                                    {app.status}
                                                </span>
                                            </td>
                                            <td>
                                                <button className="ap-btn ap-btn-sm" onClick={() => handleView(app)}>
                                                    View
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="7" className="ap-no-data">No online appointments found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ========== VIEW DETAILS MODAL ========== */}
            {showViewModal && currentAppointment && (
                <div className="ap-modal-overlay" onClick={() => setShowViewModal(false)}>
                    <div className="ap-modal" onClick={e => e.stopPropagation()}>
                        <div className="ap-modal-header">
                            <h3>Appointment Details</h3>
                            <span className="ap-id-badge">#{currentAppointment.appointment_id}</span>
                        </div>

                        <div className="ap-details-grid">
                            <div className="ap-detail-item">
                                <label>Client</label>
                                <span>
                                    {currentAppointment.clientAccount
                                        ? `${currentAppointment.clientAccount.first_name} ${currentAppointment.clientAccount.last_name}`
                                        : 'Unknown Client'}
                                </span>
                                {currentAppointment.clientAccount?.email && (
                                    <small>{currentAppointment.clientAccount.email}</small>
                                )}
                                {currentAppointment.clientAccount?.phone && (
                                    <small>{currentAppointment.clientAccount.phone}</small>
                                )}
                            </div>
                            <div className="ap-detail-item">
                                <label>Service</label>
                                <span>{currentAppointment.service?.name || 'N/A'}</span>
                                {currentAppointment.service?.price && (
                                    <small>₱{Number(currentAppointment.service.price).toLocaleString()}</small>
                                )}
                            </div>
                            <div className="ap-detail-item">
                                <label>Doctor</label>
                                <span>{currentAppointment.doctor?.full_name || 'Unassigned'}</span>
                            </div>
                            <div className="ap-detail-item">
                                <label>Date</label>
                                <span>{formatDate(currentAppointment.appointment_date)}</span>
                            </div>
                            <div className="ap-detail-item">
                                <label>Time</label>
                                <span>{formatTime(currentAppointment.appointment_time)}</span>
                            </div>
                            <div className="ap-detail-item">
                                <label>Status</label>
                                <span className={`ap-status-badge ${getStatusClass(currentAppointment.status)}`}>
                                    {currentAppointment.status}
                                </span>
                            </div>
                            <div className="ap-detail-item">
                                <label>Booked On</label>
                                <span>{currentAppointment.created_at ? formatDate(currentAppointment.created_at) : 'N/A'}</span>
                            </div>
                            <div className="ap-detail-item">
                                <label>Type</label>
                                <span style={{ textTransform: 'capitalize' }}>{currentAppointment.appointment_type || 'Online'}</span>
                            </div>
                        </div>

                        {currentAppointment.notes && (
                            <div className="ap-notes-section">
                                <label>Notes</label>
                                <p>{currentAppointment.notes}</p>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="ap-modal-actions">
                            {currentAppointment.status?.toLowerCase() === 'pending' && (
                                <>
                                    <button className="ap-btn ap-btn-success" onClick={() => handleStatusUpdate('Approved')}>
                                        ✓ Approve
                                    </button>
                                    <button className="ap-btn ap-btn-danger" onClick={() => handleStatusUpdate('Cancelled')}>
                                        ✕ Cancel
                                    </button>
                                </>
                            )}
                            {currentAppointment.status?.toLowerCase() === 'approved' && (
                                <>
                                    <button className="ap-btn ap-btn-primary" onClick={() => handleStatusUpdate('Completed')}>
                                        ✓ Mark Completed
                                    </button>
                                    <button className="ap-btn ap-btn-danger" onClick={() => handleStatusUpdate('Cancelled')}>
                                        ✕ Cancel
                                    </button>
                                </>
                            )}
                            {!['pending', 'approved'].includes(currentAppointment.status?.toLowerCase()) && (
                                <p className="ap-status-message">
                                    This appointment is <strong>{currentAppointment.status?.toLowerCase()}</strong>. No actions available.
                                </p>
                            )}
                        </div>

                        <div className="ap-modal-footer ap-modal-footer-center">
                            <button className="ap-btn ap-btn-secondary" onClick={() => setShowViewModal(false)}>Close</button>
                        </div>
                    </div>
                </div>
            )}

            {NotificationModal}
        </div>
    );
};

export default OnlineAppointments;
