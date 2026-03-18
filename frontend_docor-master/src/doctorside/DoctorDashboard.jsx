import React, { useState, useEffect } from 'react';
import api from '../services/api';
import doctorAuthService from '../services/doctorAuthService';

const DoctorDashboard = () => {
    const doctor = doctorAuthService.getStoredDoctor();
    const [appointments, setAppointments] = useState([]);
    const [reminders, setReminders] = useState([]);
    const [dutyStatus, setDutyStatus] = useState(doctor?.status || 'on-duty');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const [aptsRes, remRes] = await Promise.all([
                api.get('/doctor/appointments'),
                api.get('/doctor/reminders')
            ]);
            setAppointments(aptsRes.data.data || []);
            setReminders(remRes.data.data || []);
        } catch (error) {
            console.error('Failed to load dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleDutyStatus = async () => {
        const newStatus = dutyStatus === 'on-duty' ? 'on-leave' : 'on-duty';
        try {
            await api.put('/doctor/duty-status', { status: newStatus });
            setDutyStatus(newStatus);
        } catch (error) {
            console.error('Failed to update status:', error);
        }
    };

    const todayStr = new Date().toISOString().split('T')[0];
    const todayAppointments = appointments.filter(a => a.appointment_date === todayStr);
    const pendingCount = appointments.filter(a => a.status === 'Pending').length;
    const approvedCount = appointments.filter(a => a.status === 'Approved').length;
    const inSessionCount = appointments.filter(a => a.status === 'In Session').length;
    const completedCount = appointments.filter(a => a.status === 'Completed').length;

    if (loading) {
        return (
            <div className="doc-empty">
                <div className="empty-icon">⏳</div>
                <h4>Loading dashboard...</h4>
            </div>
        );
    }

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1>Welcome, Dr. {doctor?.full_name?.split(' ').pop() || 'Doctor'}!</h1>
                    <div className="breadcrumb">Dashboard Overview</div>
                </div>
                <div className="duty-toggle">
                    <span className="toggle-label">{dutyStatus === 'on-duty' ? '🟢 On Duty' : '🟡 On Leave'}</span>
                    <div
                        className={`toggle-switch ${dutyStatus === 'on-duty' ? 'active' : ''}`}
                        onClick={toggleDutyStatus}
                    >
                        <div className="toggle-knob"></div>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="doc-stats-grid">
                <div className="doc-stat-card">
                    <div className="stat-icon blue">📋</div>
                    <div className="stat-content">
                        <h4>Today's Appointments</h4>
                        <div className="value">{todayAppointments.length}</div>
                    </div>
                </div>
                <div className="doc-stat-card">
                    <div className="stat-icon amber">⏳</div>
                    <div className="stat-content">
                        <h4>Pending</h4>
                        <div className="value">{pendingCount}</div>
                    </div>
                </div>
                <div className="doc-stat-card">
                    <div className="stat-icon green">✅</div>
                    <div className="stat-content">
                        <h4>Approved</h4>
                        <div className="value">{approvedCount}</div>
                    </div>
                </div>
                <div className="doc-stat-card">
                    <div className="stat-icon red">🏥</div>
                    <div className="stat-content">
                        <h4>Completed</h4>
                        <div className="value">{completedCount}</div>
                    </div>
                </div>
            </div>

            {/* Reminders */}
            {reminders.length > 0 && (
                <div className="doc-card" style={{ marginBottom: 24 }}>
                    <div className="card-header">
                        <h3>🔔 Upcoming Reminders</h3>
                    </div>
                    <div className="reminder-list">
                        {reminders.slice(0, 5).map((r, i) => (
                            <div key={i} className={`reminder-item ${r.reminder_type === '15min' ? 'urgent' : ''}`}>
                                <span className="reminder-icon">{r.reminder_type === '15min' ? '🔴' : '🔔'}</span>
                                <div className="reminder-text">
                                    <strong>
                                        {r.patient?.name || r.client_account?.first_name || 'Patient'} — {r.service?.name || 'Service'}
                                    </strong>
                                    <span>
                                        {new Date(r.appointment_date).toLocaleDateString()} at {r.appointment_time}
                                        {r.reminder_type === '15min' ? ' — Starting soon!' : ''}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Today's Appointment List */}
            <div className="doc-card">
                <div className="card-header">
                    <h3>📅 Today's Queue</h3>
                    <span className="doc-badge approved">{todayAppointments.length} patients</span>
                </div>
                {todayAppointments.length > 0 ? (
                    <table className="doc-table">
                        <thead>
                            <tr>
                                <th>Time</th>
                                <th>Patient</th>
                                <th>Service</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {todayAppointments
                                .sort((a, b) => (a.appointment_time || '').localeCompare(b.appointment_time || ''))
                                .map(apt => (
                                    <tr key={apt.appointment_id}>
                                        <td>{apt.appointment_time || '—'}</td>
                                        <td>{apt.patient?.name || apt.client_account?.first_name || 'Walk-in'}</td>
                                        <td>{apt.service?.name || '—'}</td>
                                        <td>
                                            <span className={`doc-badge ${apt.status?.toLowerCase().replace(' ', '-')}`}>
                                                {apt.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="doc-empty">
                        <div className="empty-icon">📭</div>
                        <h4>No appointments today</h4>
                        <p>Enjoy your break or check upcoming days.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DoctorDashboard;
