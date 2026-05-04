import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { FaCalendarAlt, FaChevronLeft, FaChevronRight, FaClock, FaEye } from 'react-icons/fa';
import './DoctorLayout.css';

// Helper: format date as YYYY-MM-DD in local timezone
const toLocalDateStr = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const DoctorAppointments = () => {

    const navigate = useNavigate();
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);

    // Calendar state
    const [viewMode, setViewMode] = useState('month');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());

    // View Modal state
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedAppt, setSelectedAppt] = useState(null);

    useEffect(() => {
        fetchAppointments();
    }, []);

    const fetchAppointments = async () => {
        try {
            const res = await api.get('/doctor/appointments');
            const all = res.data.data || [];
            // Only show active appointments (pending, approved, ongoing) from today onwards
            const todayStr = toLocalDateStr(new Date());
            const active = all.filter(a => {
                const status = (a.status || '').toLowerCase();
                const isActive = ['pending', 'approved', 'ongoing'].includes(status);
                const isCurrent = a.appointment_date >= todayStr;
                return isActive && isCurrent;
            });
            setAppointments(active);
        } catch (error) {
            console.error('Failed to fetch appointments:', error);
        } finally {
            setLoading(false);
        }
    };

    // --- View Modal ---
    const openViewModal = (appt) => {
        setSelectedAppt(appt);
        setShowViewModal(true);
    };

    const closeViewModal = () => {
        setShowViewModal(false);
        setSelectedAppt(null);
    };

    // --- Action Handlers ---
    const handleAccept = async (id) => {
        setActionLoading(id);
        try {
            await api.put(`/doctor/appointments/${id}/accept`);
            closeViewModal();
            fetchAppointments();
        } catch (error) {
            console.error('Failed to accept:', error);
        } finally {
            setActionLoading(null);
        }
    };

    const handleCancel = async (id) => {
        if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
        setActionLoading(id);
        try {
            await api.put(`/doctor/appointments/${id}/cancel`);
            closeViewModal();
            fetchAppointments();
        } catch (error) {
            console.error('Failed to cancel:', error);
        } finally {
            setActionLoading(null);
        }
    };

    const handleProceed = async (id) => {
        setActionLoading(id);
        try {
            // Accept first, then start session
            await api.put(`/doctor/appointments/${id}/accept`);
            await api.put(`/doctor/appointments/${id}/start-session`);
            closeViewModal();
            fetchAppointments();
        } catch (error) {
            console.error('Failed to proceed:', error);
        } finally {
            setActionLoading(null);
        }
    };

    const handleStartSession = async (id) => {
        setActionLoading(id);
        try {
            await api.put(`/doctor/appointments/${id}/start-session`);
            closeViewModal();
            fetchAppointments();
        } catch (error) {
            console.error('Failed to start session:', error);
        } finally {
            setActionLoading(null);
        }
    };

    const handleEndSession = async (id) => {
        setActionLoading(id);
        try {
            // Fetch the full appointment object to pass to session page
            const res = await api.get('/doctor/appointments');
            const appt = (res.data.data || []).find(a => a.appointment_id === id);
            closeViewModal();
            navigate(`/doctor/appointments/${id}/session`, {
                state: { appointment: appt || selectedAppt }
            });
        } catch (error) {
            console.error('Failed to start session:', error);
        } finally {
            setActionLoading(null);
        }
    };

    // --- Calendar Helpers ---
    const isAppointmentPast = (appointmentDate, appointmentTime) => {
        const now = new Date();
        const apptDateTime = new Date(`${appointmentDate} ${appointmentTime}`);
        return apptDateTime < now;
    };

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const days = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay();
        return { days, firstDay };
    };

    const formatDate = (date) => {
        return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    };

    const handlePrev = () => {
        const newDate = new Date(currentDate);
        if (viewMode === 'month') newDate.setMonth(newDate.getMonth() - 1);
        else if (viewMode === 'week') newDate.setDate(newDate.getDate() - 7);
        else newDate.setDate(newDate.getDate() - 1);
        setCurrentDate(newDate);
    };

    const handleNext = () => {
        const newDate = new Date(currentDate);
        if (viewMode === 'month') newDate.setMonth(newDate.getMonth() + 1);
        else if (viewMode === 'week') newDate.setDate(newDate.getDate() + 7);
        else newDate.setDate(newDate.getDate() + 1);
        setCurrentDate(newDate);
    };

    const handleDateClick = (day) => {
        const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        setSelectedDate(newDate);
    };

    const getPatientName = (appt) => {
        return appt.patient?.name ||
            (appt.client_account ? `${appt.client_account.first_name || ''} ${appt.client_account.last_name || ''}`.trim() : null) ||
            (appt.clientAccount ? `${appt.clientAccount.first_name || ''} ${appt.clientAccount.last_name || ''}`.trim() : null) ||
            'Walk-in';
    };

    const getPatientEmail = (appt) => {
        return appt.patient?.email || appt.client_account?.email || appt.clientAccount?.email || '—';
    };

    const getPatientPhone = (appt) => {
        return appt.patient?.phone || appt.client_account?.phone || appt.clientAccount?.phone || '—';
    };

    const getStatusBadgeStyle = (status) => {
        const s = status?.toLowerCase();
        let bg = '#fff3e0', color = '#f57c00';
        if (s === 'approved' || s === 'confirmed') { bg = '#e8f5e9'; color = '#2e7d32'; }
        else if (s === 'completed') { bg = '#e3f2fd'; color = '#1976d2'; }
        else if (s === 'in session' || s === 'ongoing') { bg = '#fff9c4'; color = '#f57f17'; }
        else if (s === 'cancelled') { bg = '#ffebee'; color = '#c62828'; }
        return { backgroundColor: bg, color, padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' };
    };

    // --- Styles ---
    const fontStyle = { fontFamily: 'Calibri, sans-serif' };
    const headerStyle = { ...fontStyle, fontSize: '15px', fontWeight: 'bold', color: '#5D4E37' };
    const textStyle = { ...fontStyle, fontSize: '12px', color: '#555' };
    const modalLabelStyle = { display: 'block', marginBottom: '5px', color: '#5D4E37', fontWeight: 'bold', fontSize: '13px' };
    const modalValueStyle = { fontSize: '14px', color: '#333' };

    const todayStr = toLocalDateStr(new Date());
    const todaysAppointments = appointments.filter(a => a.appointment_date === todayStr);

    // --- Render Calendar Views ---
    const renderMonthView = () => {
        const { days, firstDay } = getDaysInMonth(currentDate);
        const blanks = Array(firstDay).fill(null);
        const daysArray = Array.from({ length: days }, (_, i) => i + 1);

        return (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '5px' }}>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                    <div key={d} style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '12px', color: '#8B7355', padding: '5px' }}>{d}</div>
                ))}
                {blanks.map((_, i) => <div key={`blank-${i}`} />)}
                {daysArray.map(day => {
                    const dayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                    const dayDateStr = toLocalDateStr(dayDate);
                    const isSelected = selectedDate.getDate() === day && selectedDate.getMonth() === currentDate.getMonth() && selectedDate.getFullYear() === currentDate.getFullYear();
                    const isToday = new Date().getDate() === day && new Date().getMonth() === currentDate.getMonth() && new Date().getFullYear() === currentDate.getFullYear();

                    const dayAppointments = appointments.filter(a => a.appointment_date === dayDateStr);
                    const appointmentCount = dayAppointments.length;
                    const hasPastAppt = dayAppointments.some(a => isAppointmentPast(a.appointment_date, a.appointment_time));
                    const hasFutureAppt = dayAppointments.some(a => !isAppointmentPast(a.appointment_date, a.appointment_time));

                    let bgColor = '#f9f9f9';
                    if (isSelected) bgColor = '#5D4E37';
                    else if (isToday) bgColor = '#E0D5C7';
                    else if (appointmentCount > 0) {
                        if (hasPastAppt && hasFutureAppt) bgColor = 'linear-gradient(135deg, #F5E6D3 50%, #E8D5C0 50%)';
                        else if (hasPastAppt) bgColor = '#F5E6D3';
                        else bgColor = '#E8D5C0';
                    }

                    return (
                        <div
                            key={day}
                            onClick={() => handleDateClick(day)}
                            style={{
                                padding: '10px', textAlign: 'center', borderRadius: '8px',
                                cursor: 'pointer', background: bgColor,
                                color: isSelected ? 'white' : '#333',
                                border: appointmentCount > 0 ? '2px solid #A89078' : '1px solid #eee',
                                fontSize: '12px', minHeight: '70px',
                                display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'center',
                                position: 'relative', transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => { if (appointmentCount > 0) { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)'; } }}
                            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none'; }}
                        >
                            <span style={{ fontWeight: 'bold', fontSize: '14px' }}>{day}</span>
                            {appointmentCount > 0 && (
                                <div style={{
                                    marginTop: '4px', padding: '2px 6px', borderRadius: '10px',
                                    backgroundColor: isSelected ? 'rgba(255,255,255,0.3)' : '#5D4E37',
                                    color: 'white', fontSize: '10px', fontWeight: 'bold'
                                }}>
                                    {appointmentCount} {appointmentCount === 1 ? 'appt' : 'appts'}
                                </div>
                            )}
                            {(hasPastAppt || hasFutureAppt) && (
                                <div style={{ display: 'flex', gap: '3px', marginTop: '4px', position: 'absolute', bottom: '5px' }}>
                                    {hasPastAppt && <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: isSelected ? '#fff' : '#A89078' }} title="Past appointments"></div>}
                                    {hasFutureAppt && <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: isSelected ? '#fff' : '#5D4E37' }} title="Upcoming appointments"></div>}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    const renderWeekView = () => {
        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
        const weekDays = Array.from({ length: 7 }, (_, i) => {
            const d = new Date(startOfWeek);
            d.setDate(startOfWeek.getDate() + i);
            return d;
        });

        return (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '5px' }}>
                {weekDays.map((date, i) => {
                    const isSelected = selectedDate.toDateString() === date.toDateString();
                    return (
                        <div
                            key={i}
                            onClick={() => { setSelectedDate(date); setCurrentDate(date); }}
                            style={{
                                padding: '10px', textAlign: 'center', borderRadius: '8px', cursor: 'pointer',
                                backgroundColor: isSelected ? '#5D4E37' : '#f9f9f9',
                                color: isSelected ? 'white' : '#333',
                                border: '1px solid #eee', minHeight: '100px'
                            }}
                        >
                            <div style={{ fontSize: '12px', marginBottom: '5px' }}>{date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                            <div style={{ fontSize: '15px', fontWeight: 'bold' }}>{date.getDate()}</div>
                        </div>
                    );
                })}
            </div>
        );
    };

    const renderDayView = () => {
        const hours = Array.from({ length: 9 }, (_, i) => i + 9);
        const selectedDateStr = toLocalDateStr(selectedDate);

        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '400px', overflowY: 'auto' }}>
                {hours.map(hour => {
                    const timeLabel = hour < 10 ? `0${hour}:00` : `${hour}:00`;
                    const appt = appointments.find(a =>
                        a.appointment_time?.startsWith(timeLabel) &&
                        a.appointment_date === selectedDateStr
                    );
                    const isPast = appt ? isAppointmentPast(appt.appointment_date, appt.appointment_time) : false;
                    const bgColor = appt ? (isPast ? '#F5F1EE' : '#e8f5e9') : 'transparent';

                    return (
                        <div key={hour} style={{ display: 'flex', borderBottom: '1px solid #eee', padding: '10px 0' }}>
                            <div style={{ width: '80px', fontSize: '12px', color: '#666', fontWeight: 'bold' }}>{timeLabel}</div>
                            <div style={{ flex: 1, minHeight: '40px', backgroundColor: bgColor, borderRadius: '4px', padding: '5px' }}>
                                {appt ? (
                                    <div>
                                        <div style={{ fontWeight: 'bold', fontSize: '12px', color: isPast ? '#A89078' : '#2e7d32' }}>
                                            {getPatientName(appt)}
                                        </div>
                                        <div style={{ fontSize: '11px', color: '#555' }}>
                                            {appt.service?.name || 'Appointment'}
                                        </div>
                                        {isPast && <div style={{ fontSize: '10px', color: '#A89078', fontStyle: 'italic' }}>Past</div>}
                                    </div>
                                ) : (
                                    <span style={{ fontSize: '11px', color: '#ccc' }}>Available</span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="doc-empty">
                <div className="empty-icon">⏳</div>
                <h4>Loading appointments...</h4>
            </div>
        );
    }

    return (
        <div style={fontStyle}>
            <div className="page-header">
                <div>
                    <h1>Appointments</h1>
                    <div className="breadcrumb">Doctor Portal &gt; Appointments Calendar</div>
                </div>
            </div>

            {/* Calendar Section */}
            <div className="chart-container" style={{ padding: '20px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={() => setViewMode('month')} style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #E0D5C7', background: viewMode === 'month' ? '#5D4E37' : 'white', color: viewMode === 'month' ? 'white' : '#5D4E37', cursor: 'pointer', ...textStyle }}>Month</button>
                        <button onClick={() => setViewMode('week')} style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #E0D5C7', background: viewMode === 'week' ? '#5D4E37' : 'white', color: viewMode === 'week' ? 'white' : '#5D4E37', cursor: 'pointer', ...textStyle }}>Week</button>
                        <button onClick={() => setViewMode('day')} style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #E0D5C7', background: viewMode === 'day' ? '#5D4E37' : 'white', color: viewMode === 'day' ? 'white' : '#5D4E37', cursor: 'pointer', ...textStyle }}>Day</button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <button onClick={handlePrev} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5D4E37' }}><FaChevronLeft /></button>
                        <span style={{ ...headerStyle, minWidth: '150px', textAlign: 'center' }}>
                            {viewMode === 'day' ? formatDate(currentDate) : currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </span>
                        <button onClick={handleNext} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5D4E37' }}><FaChevronRight /></button>
                    </div>
                </div>

                {viewMode === 'month' && renderMonthView()}
                {viewMode === 'week' && renderWeekView()}
                {viewMode === 'day' && renderDayView()}
            </div>

            {/* Schedule for Selected Date */}
            <div className="chart-container" style={{ padding: '20px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h3 style={{ ...headerStyle, display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
                        <FaCalendarAlt /> Schedule for {selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                    </h3>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {appointments.filter(a => a.appointment_date === toLocalDateStr(selectedDate)).length > 0 ? (
                        appointments.filter(a => a.appointment_date === toLocalDateStr(selectedDate)).map(appt => {
                            const isPast = isAppointmentPast(appt.appointment_date, appt.appointment_time);
                            const borderColor = isPast ? '#A89078' : '#5D4E37';
                            const bgColor = isPast ? '#F5F1EE' : 'white';

                            return (
                                <div key={appt.appointment_id} style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    padding: '15px', backgroundColor: bgColor, borderRadius: '8px',
                                    borderLeft: `4px solid ${borderColor}`, boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
                                }}>
                                    <div>
                                        <div style={{ ...headerStyle, fontSize: '14px' }}>
                                            {appt.appointment_time} - {appt.service?.name || 'Appointment'}
                                        </div>
                                        <div style={textStyle}>
                                            Patient: {getPatientName(appt)}
                                        </div>
                                        {isPast && <div style={{ fontSize: '10px', color: '#A89078', fontStyle: 'italic', marginTop: '4px' }}>Past Appointment</div>}
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                        <div style={getStatusBadgeStyle(appt.status)}>{appt.status}</div>
                                        <button
                                            onClick={() => openViewModal(appt)}
                                            style={{
                                                padding: '6px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                                                backgroundColor: '#5D4E37', color: 'white', fontSize: '12px', fontWeight: '600',
                                                display: 'flex', alignItems: 'center', gap: '6px'
                                            }}
                                        >
                                            <FaEye /> View
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div style={{ padding: '20px', textAlign: 'center', color: '#999', fontStyle: 'italic', ...textStyle }}>
                            No appointments scheduled for this date.
                        </div>
                    )}
                </div>
            </div>

            {/* Appointments Today Section */}
            <div className="chart-container" style={{ padding: '20px' }}>
                <h3 style={{ ...headerStyle, marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <FaClock /> Appointments Today ({new Date().toLocaleDateString()})
                </h3>
                {todaysAppointments.length > 0 ? (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', ...textStyle }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid #E0D5C7', textAlign: 'left' }}>
                                    <th style={{ padding: '10px' }}>Time</th>
                                    <th style={{ padding: '10px' }}>Patient</th>
                                    <th style={{ padding: '10px' }}>Service</th>
                                    <th style={{ padding: '10px' }}>Status</th>
                                    <th style={{ padding: '10px' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {todaysAppointments
                                    .sort((a, b) => (a.appointment_time || '').localeCompare(b.appointment_time || ''))
                                    .map(appt => (
                                        <tr key={appt.appointment_id} style={{ borderBottom: '1px solid #eee' }}>
                                            <td style={{ padding: '10px' }}>{appt.appointment_time}</td>
                                            <td style={{ padding: '10px', fontWeight: 'bold' }}>{getPatientName(appt)}</td>
                                            <td style={{ padding: '10px' }}>{appt.service?.name || 'Appointment'}</td>
                                            <td style={{ padding: '10px' }}>
                                                <span style={getStatusBadgeStyle(appt.status)}>{appt.status}</span>
                                            </td>
                                            <td style={{ padding: '10px' }}>
                                                <button
                                                    onClick={() => openViewModal(appt)}
                                                    style={{
                                                        padding: '5px 14px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                                                        backgroundColor: '#5D4E37', color: 'white', fontSize: '11px', fontWeight: '600',
                                                        display: 'inline-flex', alignItems: 'center', gap: '5px'
                                                    }}
                                                >
                                                    <FaEye /> View
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: '20px', color: '#888', fontStyle: 'italic' }}>
                        No appointments scheduled for today.
                    </div>
                )}
            </div>

            {/* ===== Appointment Detail Modal ===== */}
            {showViewModal && selectedAppt && (
                <div className="doc-modal-overlay" style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
                    justifyContent: 'center', alignItems: 'center', zIndex: 2000
                }}>
                    <div style={{
                        background: 'white', borderRadius: '16px', padding: '32px',
                        maxWidth: '600px', width: '90%', maxHeight: '90vh', overflowY: 'auto',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.2)', fontFamily: 'Calibri, sans-serif'
                    }}>
                        {/* Modal Header */}
                        <h3 style={{
                            marginBottom: '20px', paddingBottom: '12px',
                            borderBottom: '2px solid #E0D5C7', color: '#5D4E37',
                            fontSize: '18px', fontWeight: '700'
                        }}>
                            Appointment Details #{selectedAppt.appointment_id}
                        </h3>

                        {/* Patient Details Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px', marginBottom: '20px' }}>
                            <div>
                                <span style={modalLabelStyle}>Patient</span>
                                <div style={{ ...modalValueStyle, fontWeight: '700' }}>{getPatientName(selectedAppt)}</div>
                                <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>{getPatientEmail(selectedAppt)}</div>
                                <div style={{ fontSize: '12px', color: '#666' }}>{getPatientPhone(selectedAppt)}</div>
                            </div>

                            <div>
                                <span style={modalLabelStyle}>Service</span>
                                <div style={modalValueStyle}>{selectedAppt.service?.name || 'General Appointment'}</div>
                                <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
                                    ₱{Number(selectedAppt.service?.price || 0).toLocaleString()}
                                </div>
                            </div>

                            <div>
                                <span style={modalLabelStyle}>Date</span>
                                <div style={modalValueStyle}>
                                    {selectedAppt.appointment_date ? new Date(selectedAppt.appointment_date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
                                </div>
                            </div>

                            <div>
                                <span style={modalLabelStyle}>Time</span>
                                <div style={modalValueStyle}>{selectedAppt.appointment_time || '—'}</div>
                            </div>

                            <div>
                                <span style={modalLabelStyle}>Type</span>
                                <div style={{ ...modalValueStyle, textTransform: 'capitalize' }}>
                                    {selectedAppt.appointment_type || 'In-Person'}
                                </div>
                            </div>

                            <div>
                                <span style={modalLabelStyle}>Status</span>
                                <div>
                                    <span style={getStatusBadgeStyle(selectedAppt.status)}>{selectedAppt.status}</span>
                                </div>
                            </div>
                        </div>

                        {/* Notes */}
                        {selectedAppt.notes && (
                            <div style={{ marginBottom: '20px' }}>
                                <span style={modalLabelStyle}>Notes</span>
                                <div style={{
                                    padding: '10px 14px', backgroundColor: '#F8F6F2', borderRadius: '8px',
                                    fontSize: '13px', color: '#555', lineHeight: '1.5'
                                }}>
                                    {selectedAppt.notes}
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '2px solid #E0D5C7' }}>
                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                                {/* Pending → Cancel + Proceed */}
                                {selectedAppt.status === 'pending' && (
                                    <>
                                        <button
                                            onClick={() => handleCancel(selectedAppt.appointment_id)}
                                            disabled={actionLoading === selectedAppt.appointment_id}
                                            style={{
                                                padding: '12px 36px', backgroundColor: '#f44336', color: 'white',
                                                border: 'none', borderRadius: '8px', cursor: 'pointer',
                                                fontSize: '15px', fontWeight: '700', minWidth: '140px',
                                                boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                                                opacity: actionLoading === selectedAppt.appointment_id ? 0.6 : 1
                                            }}
                                        >
                                            ✕ Cancel
                                        </button>
                                        <button
                                            onClick={() => handleProceed(selectedAppt.appointment_id)}
                                            disabled={actionLoading === selectedAppt.appointment_id}
                                            style={{
                                                padding: '12px 36px', backgroundColor: '#4CAF50', color: 'white',
                                                border: 'none', borderRadius: '8px', cursor: 'pointer',
                                                fontSize: '15px', fontWeight: '700', minWidth: '140px',
                                                boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                                                opacity: actionLoading === selectedAppt.appointment_id ? 0.6 : 1
                                            }}
                                        >
                                            {actionLoading === selectedAppt.appointment_id ? 'Processing...' : '▶ Proceed'}
                                        </button>
                                    </>
                                )}

                                {/* Approved → Start Session */}
                                {selectedAppt.status === 'approved' && (
                                    <button
                                        onClick={() => handleStartSession(selectedAppt.appointment_id)}
                                        disabled={actionLoading === selectedAppt.appointment_id}
                                        style={{
                                            padding: '12px 40px', backgroundColor: '#5D4E37', color: 'white',
                                            border: 'none', borderRadius: '8px', cursor: 'pointer',
                                            fontSize: '15px', fontWeight: '700', minWidth: '180px',
                                            boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                                            opacity: actionLoading === selectedAppt.appointment_id ? 0.6 : 1
                                        }}
                                    >
                                        ▶ Start Session
                                    </button>
                                )}

                                {/* In Session → Complete (go to session form) */}
                                {selectedAppt.status === 'ongoing' && (
                                    <button
                                        onClick={() => handleEndSession(selectedAppt.appointment_id)}
                                        disabled={actionLoading === selectedAppt.appointment_id}
                                        style={{
                                            padding: '12px 40px', backgroundColor: '#137333', color: 'white',
                                            border: 'none', borderRadius: '8px', cursor: 'pointer',
                                            fontSize: '15px', fontWeight: '700', minWidth: '200px',
                                            boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                                            opacity: actionLoading === selectedAppt.appointment_id ? 0.6 : 1
                                        }}
                                    >
                                        {actionLoading === selectedAppt.appointment_id ? 'Loading...' : '✎ Open Session Form'}
                                    </button>
                                )}

                                {/* Completed / Cancelled — info only */}
                                {!['pending', 'approved', 'ongoing'].includes(selectedAppt.status) && (
                                    <div style={{ textAlign: 'center', color: '#666', fontStyle: 'italic', padding: '10px', fontSize: '14px' }}>
                                        This appointment is {selectedAppt.status?.toLowerCase()}. No actions available.
                                    </div>
                                )}
                            </div>

                            {/* Close Button */}
                            <div style={{ marginTop: '16px', textAlign: 'center' }}>
                                <button
                                    onClick={closeViewModal}
                                    style={{
                                        padding: '10px 30px', backgroundColor: '#666', color: 'white',
                                        border: 'none', borderRadius: '6px', cursor: 'pointer',
                                        fontSize: '14px', fontWeight: '600'
                                    }}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DoctorAppointments;
