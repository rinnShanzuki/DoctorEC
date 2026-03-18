import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { FaCalendarAlt, FaChevronLeft, FaChevronRight, FaClock, FaPlus, FaTrash, FaEdit, FaSyncAlt, FaTimes } from 'react-icons/fa';
import './DoctorLayout.css';

// Helpers
const toLocalDateStr = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const DAY_NAMES = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABELS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const getWeekStart = (date) => {
    const d = new Date(date);
    const day = d.getDay(); // 0=Sun
    const diff = day === 0 ? -6 : 1 - day; // Monday
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
};

const getWeekDates = (weekStart) => {
    return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(weekStart);
        d.setDate(weekStart.getDate() + i);
        return d;
    });
};

const formatTimeDisplay = (time) => {
    if (!time) return '';
    const [h, m] = time.split(':');
    const hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const h12 = hour % 12 || 12;
    return `${h12}:${m} ${ampm}`;
};

const generateTimeSlots = (startTime, endTime) => {
    if (!startTime || !endTime) return [];
    const slots = [];
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    let current = sh * 60 + sm;
    const end = eh * 60 + em;

    while (current + 30 <= end) {
        const slotStart = `${String(Math.floor(current / 60)).padStart(2, '0')}:${String(current % 60).padStart(2, '0')}`;
        const slotEnd = `${String(Math.floor((current + 30) / 60)).padStart(2, '0')}:${String((current + 30) % 60).padStart(2, '0')}`;
        slots.push({ start: slotStart, end: slotEnd });
        current += 45; // 30 min session + 15 min break
    }
    return slots;
};

const DoctorSchedule = () => {
    const [schedules, setSchedules] = useState([]);
    const [clinicHours, setClinicHours] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [applyingWeek, setApplyingWeek] = useState(false);

    // Calendar state
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedWeekStart, setSelectedWeekStart] = useState(getWeekStart(new Date()));

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        schedule_date: '',
        start_time: '09:00',
        end_time: '17:30',
        status: 'available',
    });

    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
    };

    useEffect(() => {
        const init = async () => {
            await autoFillUpcomingWeeks();
            await fetchSchedules();
            await fetchClinicHours();
        };
        init();
    }, []);

    useEffect(() => {
        setSelectedWeekStart(getWeekStart(selectedDate));
    }, [selectedDate]);

    const fetchSchedules = async () => {
        try {
            const res = await api.get('/doctor/schedules');
            setSchedules(res.data.data || []);
        } catch (error) {
            console.error('Failed to fetch schedules:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchClinicHours = async () => {
        try {
            const res = await api.get('/doctor/clinic-hours');
            setClinicHours(res.data.data || null);
        } catch (error) {
            console.error('Failed to fetch clinic hours:', error);
        }
    };

    const autoFillUpcomingWeeks = async () => {
        try {
            // Auto-fill current week and next 3 weeks
            const today = new Date();
            for (let w = 0; w < 4; w++) {
                const weekDate = new Date(today);
                weekDate.setDate(today.getDate() + (w * 7));
                const weekStart = getWeekStart(weekDate);
                await api.post('/doctor/schedules/apply-week', {
                    week_start: toLocalDateStr(weekStart)
                });
            }
        } catch (error) {
            console.error('Auto-fill failed (may be normal on first load):', error);
        }
    };

    const handleRefreshSchedules = async () => {
        setApplyingWeek(true);
        try {
            await autoFillUpcomingWeeks();
            await fetchSchedules();
            showToast('Schedules synced with clinic hours!', 'success');
        } catch (error) {
            showToast('Failed to sync', 'error');
        } finally {
            setApplyingWeek(false);
        }
    };

    const openCreateModal = (dateOverride) => {
        const date = dateOverride || selectedDate;
        const dayName = DAY_NAMES[((date.getDay() + 6) % 7)]; // JS day to Mon=0
        const defaults = clinicHours?.[dayName];
        setEditingId(null);
        setFormData({
            schedule_date: toLocalDateStr(date),
            start_time: defaults?.start || '09:00',
            end_time: defaults?.end || '17:30',
            status: 'available',
        });
        setShowModal(true);
    };

    const openEditModal = (schedule) => {
        setEditingId(schedule.docsched_id);
        setFormData({
            schedule_date: schedule.schedule_date || '',
            start_time: schedule.start_time || '09:00',
            end_time: schedule.end_time || '17:30',
            status: schedule.status || 'available',
        });
        setShowModal(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (editingId) {
                await api.put(`/doctor/schedules/${editingId}`, formData);
                showToast('Schedule updated!', 'success');
            } else {
                await api.post('/doctor/schedules', formData);
                showToast('Schedule created!', 'success');
            }
            setShowModal(false);
            fetchSchedules();
        } catch (error) {
            console.error('Failed to save:', error);
            showToast(error.response?.data?.message || 'Failed to save', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this schedule slot?')) return;
        try {
            await api.delete(`/doctor/schedules/${id}`);
            showToast('Schedule deleted', 'success');
            fetchSchedules();
        } catch (error) {
            console.error('Failed to delete:', error);
            showToast('Failed to delete', 'error');
        }
    };

    const handleToggleDay = async (e, scheduleId, currentStatus) => {
        e.stopPropagation();
        const newStatus = currentStatus === 'available' ? 'unavailable' : 'available';
        try {
            await api.put(`/doctor/schedules/${scheduleId}`, { status: newStatus });
            fetchSchedules();
        } catch (error) {
            console.error('Failed to toggle day:', error);
            showToast('Failed to toggle day', 'error');
        }
    };

    const handleToggleSlot = async (scheduleId, slotTime, currentlyEnabled) => {
        try {
            await api.post(`/doctor/schedules/${scheduleId}/toggle-slot`, {
                slot_time: slotTime,
                enabled: !currentlyEnabled
            });
            fetchSchedules();
        } catch (error) {
            console.error('Failed to toggle slot:', error);
            showToast('Failed to toggle slot', 'error');
        }
    };

    // --- Calendar helpers ---
    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const days = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay();
        return { days, firstDay };
    };

    const handlePrevMonth = () => { const d = new Date(currentDate); d.setMonth(d.getMonth() - 1); setCurrentDate(d); };
    const handleNextMonth = () => { const d = new Date(currentDate); d.setMonth(d.getMonth() + 1); setCurrentDate(d); };

    const handleDateClick = (day) => {
        const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        setSelectedDate(newDate);
    };

    // Derived data
    const todayStr = toLocalDateStr(new Date());
    const selectedDateStr = toLocalDateStr(selectedDate);
    const weekDates = getWeekDates(selectedWeekStart);
    const selectedDaySchedule = schedules.find(s => s.schedule_date === selectedDateStr);
    const selectedDaySlots = selectedDaySchedule ? generateTimeSlots(selectedDaySchedule.start_time, selectedDaySchedule.end_time) : [];
    const disabledSlots = selectedDaySchedule?.disabled_slots ? (typeof selectedDaySchedule.disabled_slots === 'string' ? JSON.parse(selectedDaySchedule.disabled_slots) : selectedDaySchedule.disabled_slots) : [];
    const activeSlotCount = selectedDaySlots.length - disabledSlots.length;

    // Styles
    const fontStyle = { fontFamily: 'Calibri, sans-serif' };
    const headerStyle = { ...fontStyle, fontSize: '15px', fontWeight: 'bold', color: '#5D4E37' };
    const textStyle = { ...fontStyle, fontSize: '12px', color: '#555' };
    const labelStyle = { ...textStyle, marginBottom: '5px', display: 'block', fontWeight: 'bold' };

    // --- Render Calendar ---
    const renderMonthView = () => {
        const { days, firstDay } = getDaysInMonth(currentDate);
        const blanks = Array(firstDay).fill(null);
        const daysArray = Array.from({ length: days }, (_, i) => i + 1);

        return (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                    <div key={d} style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '11px', color: '#8B7355', padding: '4px' }}>{d}</div>
                ))}
                {blanks.map((_, i) => <div key={`b-${i}`} />)}
                {daysArray.map(day => {
                    const dayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                    const dayDateStr = toLocalDateStr(dayDate);
                    const isSelected = selectedDateStr === dayDateStr;
                    const isToday = todayStr === dayDateStr;
                    const hasSched = schedules.some(s => s.schedule_date === dayDateStr);
                    const isPast = dayDateStr < todayStr;

                    // Check if it's in the selected week
                    const weekEndDate = new Date(selectedWeekStart);
                    weekEndDate.setDate(weekEndDate.getDate() + 6);
                    const isInSelectedWeek = dayDate >= selectedWeekStart && dayDate <= weekEndDate;

                    let bgColor = '#f9f9f9';
                    if (isSelected) bgColor = '#5D4E37';
                    else if (isToday) bgColor = '#E0D5C7';
                    else if (hasSched) bgColor = isPast ? '#F5E6D3' : '#E8F5E9';
                    else if (isInSelectedWeek) bgColor = '#FFF8F0';

                    return (
                        <div
                            key={day}
                            onClick={() => handleDateClick(day)}
                            style={{
                                padding: '8px 4px', textAlign: 'center', borderRadius: '6px',
                                cursor: 'pointer', backgroundColor: bgColor,
                                color: isSelected ? 'white' : '#333',
                                border: isInSelectedWeek && !isSelected ? '2px solid #E0D5C7' : hasSched ? '2px solid #A89078' : '1px solid #eee',
                                fontSize: '12px', minHeight: '50px',
                                display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
                                transition: 'all 0.15s ease', opacity: isPast && !isSelected ? 0.6 : 1
                            }}
                        >
                            <span style={{ fontWeight: 'bold', fontSize: '13px' }}>{day}</span>
                            {hasSched && (
                                <div style={{
                                    marginTop: '3px', width: '6px', height: '6px', borderRadius: '50%',
                                    backgroundColor: isSelected ? '#fff' : '#5D4E37'
                                }} />
                            )}
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
                <h4>Loading schedules...</h4>
            </div>
        );
    }

    return (
        <div style={fontStyle}>
            {/* Toast */}
            {toast.show && (
                <div style={{
                    position: 'fixed', top: '20px', right: '20px', zIndex: 9999,
                    padding: '12px 24px', borderRadius: '8px', color: 'white',
                    backgroundColor: toast.type === 'success' ? '#4caf50' : '#f44336',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)', fontSize: '13px', fontWeight: '600',
                    animation: 'slideIn 0.3s ease'
                }}>
                    {toast.message}
                </div>
            )}

            {/* Page Header */}
            <div className="page-header">
                <div>
                    <h1>My Schedule</h1>
                    <div className="breadcrumb">Doctor Portal &gt; Schedule Management</div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        onClick={handleRefreshSchedules}
                        disabled={applyingWeek}
                        style={{
                            backgroundColor: '#8B7355', color: 'white', border: 'none',
                            padding: '10px 18px', borderRadius: '8px', cursor: 'pointer',
                            fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px',
                            opacity: applyingWeek ? 0.6 : 1
                        }}
                    >
                        <FaSyncAlt style={{ animation: applyingWeek ? 'spin 1s linear infinite' : 'none' }} />
                        {applyingWeek ? 'Syncing...' : 'Sync Schedule'}
                    </button>
                    <button
                        onClick={() => openCreateModal()}
                        style={{
                            backgroundColor: '#5D4E37', color: 'white', border: 'none',
                            padding: '10px 18px', borderRadius: '8px', cursor: 'pointer',
                            fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px'
                        }}
                    >
                        <FaPlus /> Add Schedule
                    </button>
                </div>
            </div>

            {/* Two Column Layout */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

                {/* ========= LEFT: Weekly Schedule List ========= */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                    {/* Week Header */}
                    <div className="chart-container" style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <button onClick={() => { const d = new Date(selectedWeekStart); d.setDate(d.getDate() - 7); setSelectedDate(d); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5D4E37', fontSize: '14px' }}><FaChevronLeft /></button>
                            <h3 style={{ ...headerStyle, margin: 0, fontSize: '14px' }}>
                                Week of {selectedWeekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — {weekDates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </h3>
                            <button onClick={() => { const d = new Date(selectedWeekStart); d.setDate(d.getDate() + 7); setSelectedDate(d); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5D4E37', fontSize: '14px' }}><FaChevronRight /></button>
                        </div>
                    </div>

                    {/* Daily Schedule Cards */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {weekDates.map((date, idx) => {
                            const dateStr = toLocalDateStr(date);
                            const daySchedule = schedules.find(s => s.schedule_date === dateStr);
                            const dayName = DAY_NAMES[idx];
                            const clinicDefault = clinicHours?.[dayName];
                            const isSelected = selectedDateStr === dateStr;
                            const isToday = todayStr === dateStr;
                            const isClosed = clinicDefault && !clinicDefault.enabled && !daySchedule;
                            const isDayUnavailable = daySchedule && daySchedule.status === 'unavailable';

                            return (
                                <div
                                    key={dateStr}
                                    onClick={() => setSelectedDate(date)}
                                    className="chart-container"
                                    style={{
                                        padding: '12px 16px', cursor: 'pointer',
                                        borderLeft: isSelected ? '4px solid #5D4E37' : isDayUnavailable ? '4px solid #e0e0e0' : daySchedule ? '4px solid #4caf50' : isClosed ? '4px solid #e0e0e0' : '4px solid #FFB74D',
                                        backgroundColor: isSelected ? '#F9F5F0' : isToday ? '#FFFDE7' : isDayUnavailable ? '#fafafa' : 'white',
                                        transition: 'all 0.15s ease',
                                        boxShadow: isSelected ? '0 2px 8px rgba(93,78,55,0.15)' : 'none',
                                        opacity: isDayUnavailable ? 0.7 : 1
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ minWidth: '44px' }}>
                                                <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#8B7355', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                    {DAY_LABELS[idx].substring(0, 3)}
                                                </div>
                                                <div style={{ fontSize: '18px', fontWeight: 'bold', color: isSelected ? '#5D4E37' : '#333' }}>
                                                    {date.getDate()}
                                                </div>
                                            </div>
                                            <div>
                                                {daySchedule ? (
                                                    <>
                                                        <div style={{ fontSize: '13px', fontWeight: 'bold', color: isDayUnavailable ? '#bbb' : '#2e7d32', textDecoration: isDayUnavailable ? 'line-through' : 'none' }}>
                                                            {formatTimeDisplay(daySchedule.start_time)} — {formatTimeDisplay(daySchedule.end_time)}
                                                        </div>
                                                        <div style={{ fontSize: '10px', color: isDayUnavailable ? '#ccc' : '#888', marginTop: '2px' }}>
                                                            {isDayUnavailable ? 'Day disabled' : `${generateTimeSlots(daySchedule.start_time, daySchedule.end_time).length} slots available`}
                                                        </div>
                                                    </>
                                                ) : isClosed ? (
                                                    <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#bbb' }}>CLOSED</div>
                                                ) : (
                                                    <div style={{ fontSize: '12px', color: '#999', fontStyle: 'italic' }}>
                                                        No schedule set
                                                        {clinicDefault?.enabled && (
                                                            <span style={{ color: '#8B7355', fontStyle: 'normal' }}> (Default: {formatTimeDisplay(clinicDefault.start)} – {formatTimeDisplay(clinicDefault.end)})</span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                            {isToday && (
                                                <span style={{ fontSize: '9px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '10px', backgroundColor: '#FFF9C4', color: '#F9A825' }}>TODAY</span>
                                            )}
                                            {daySchedule && (
                                                <label
                                                    onClick={(e) => e.stopPropagation()}
                                                    style={{
                                                        position: 'relative', display: 'inline-block',
                                                        width: '36px', height: '20px', cursor: 'pointer',
                                                        flexShrink: 0
                                                    }}
                                                    title={daySchedule.status === 'available' ? 'Click to disable this day' : 'Click to enable this day'}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={daySchedule.status === 'available'}
                                                        onChange={(e) => handleToggleDay(e, daySchedule.docsched_id, daySchedule.status)}
                                                        style={{ opacity: 0, width: 0, height: 0 }}
                                                    />
                                                    <span style={{
                                                        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                                                        backgroundColor: daySchedule.status === 'available' ? '#4caf50' : '#ccc',
                                                        borderRadius: '20px', transition: 'all 0.3s ease'
                                                    }}>
                                                        <span style={{
                                                            position: 'absolute',
                                                            height: '14px', width: '14px',
                                                            left: daySchedule.status === 'available' ? '19px' : '3px',
                                                            bottom: '3px', backgroundColor: 'white',
                                                            borderRadius: '50%', transition: 'all 0.3s ease'
                                                        }} />
                                                    </span>
                                                </label>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ========= RIGHT: Calendar + Time Slot Detail ========= */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                    {/* Month Calendar */}
                    <div className="chart-container" style={{ padding: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                            <h3 style={{ ...headerStyle, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <FaCalendarAlt /> Calendar
                            </h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <button onClick={handlePrevMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5D4E37' }}><FaChevronLeft /></button>
                                <span style={{ ...headerStyle, minWidth: '130px', textAlign: 'center', fontSize: '14px' }}>
                                    {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                </span>
                                <button onClick={handleNextMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5D4E37' }}><FaChevronRight /></button>
                            </div>
                        </div>
                        {renderMonthView()}
                        {/* Legend */}
                        <div style={{ display: 'flex', gap: '16px', marginTop: '12px', justifyContent: 'center' }}>
                            {[
                                { color: '#E8F5E9', border: '#A89078', label: 'Has Schedule' },
                                { color: '#FFF8F0', border: '#E0D5C7', label: 'Selected Week' },
                                { color: '#5D4E37', border: '#5D4E37', label: 'Selected Day', textColor: '#fff' },
                            ].map(item => (
                                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10px', color: '#888' }}>
                                    <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: item.color, border: `1px solid ${item.border}` }} />
                                    {item.label}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Selected Day Time Slots */}
                    <div className="chart-container" style={{ padding: '20px', flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                            <h3 style={{ ...headerStyle, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <FaClock /> {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                            </h3>
                            {selectedDaySchedule ? (
                                <div style={{ display: 'flex', gap: '6px' }}>
                                    <button
                                        onClick={() => openEditModal(selectedDaySchedule)}
                                        style={{
                                            backgroundColor: 'white', color: '#5D4E37', border: '1px solid #E0D5C7',
                                            padding: '5px 12px', borderRadius: '6px', cursor: 'pointer',
                                            fontSize: '11px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px'
                                        }}
                                    >
                                        <FaEdit /> Edit Hours
                                    </button>
                                    <button
                                        onClick={() => handleDelete(selectedDaySchedule.docsched_id)}
                                        style={{
                                            backgroundColor: 'white', color: '#c62828', border: '1px solid #FFCDD2',
                                            padding: '5px 12px', borderRadius: '6px', cursor: 'pointer',
                                            fontSize: '11px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px'
                                        }}
                                    >
                                        <FaTrash /> Remove Day
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => openCreateModal()}
                                    style={{
                                        backgroundColor: '#5D4E37', color: 'white', border: 'none',
                                        padding: '5px 12px', borderRadius: '6px', cursor: 'pointer',
                                        fontSize: '11px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px'
                                    }}
                                >
                                    <FaPlus /> Set Availability
                                </button>
                            )}
                        </div>

                        {selectedDaySchedule ? (
                            <>
                                {/* Schedule Summary */}
                                <div style={{
                                    padding: '10px 14px', borderRadius: '8px', backgroundColor: '#E8F5E9',
                                    marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                }}>
                                    <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#2e7d32' }}>
                                        Working Hours: {formatTimeDisplay(selectedDaySchedule.start_time)} — {formatTimeDisplay(selectedDaySchedule.end_time)}
                                    </span>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <span style={{
                                            fontSize: '11px', padding: '3px 10px', borderRadius: '12px',
                                            backgroundColor: '#fff', color: '#2e7d32', fontWeight: 'bold'
                                        }}>
                                            {activeSlotCount} Active
                                        </span>
                                        {disabledSlots.length > 0 && (
                                            <span style={{
                                                fontSize: '11px', padding: '3px 10px', borderRadius: '12px',
                                                backgroundColor: '#FFEBEE', color: '#c62828', fontWeight: 'bold'
                                            }}>
                                                {disabledSlots.length} Disabled
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div style={{ fontSize: '11px', color: '#8B7355', marginBottom: '10px', fontStyle: 'italic' }}>
                                    💡 Toggle slots to enable or disable individual appointment times for this day.
                                </div>

                                {/* Toggleable Time Slot Grid */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', maxHeight: '280px', overflowY: 'auto' }}>
                                    {selectedDaySlots.map((slot, index) => {
                                        const isDisabled = disabledSlots.includes(slot.start);
                                        return (
                                            <div key={index} style={{
                                                padding: '10px 14px', borderRadius: '8px',
                                                backgroundColor: isDisabled ? '#f5f5f5' : '#F9F5F0',
                                                border: isDisabled ? '1px solid #e0e0e0' : '1px solid #E0D5C7',
                                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                opacity: isDisabled ? 0.6 : 1,
                                                transition: 'all 0.2s ease'
                                            }}>
                                                <div>
                                                    <div style={{
                                                        fontSize: '12px', fontWeight: '700',
                                                        color: isDisabled ? '#bbb' : '#5D4E37',
                                                        textDecoration: isDisabled ? 'line-through' : 'none'
                                                    }}>
                                                        {formatTimeDisplay(slot.start)} – {formatTimeDisplay(slot.end)}
                                                    </div>
                                                    <div style={{ fontSize: '9px', color: isDisabled ? '#ccc' : '#8B7355', marginTop: '2px' }}>
                                                        {isDisabled ? 'Disabled' : '30 min session'}
                                                    </div>
                                                </div>
                                                {/* Toggle Switch */}
                                                <label style={{
                                                    position: 'relative', display: 'inline-block',
                                                    width: '36px', height: '20px', cursor: 'pointer',
                                                    flexShrink: 0
                                                }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={!isDisabled}
                                                        onChange={() => handleToggleSlot(selectedDaySchedule.docsched_id, slot.start, !isDisabled)}
                                                        style={{ opacity: 0, width: 0, height: 0 }}
                                                    />
                                                    <span style={{
                                                        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                                                        backgroundColor: isDisabled ? '#ccc' : '#5D4E37',
                                                        borderRadius: '20px', transition: 'all 0.3s ease'
                                                    }}>
                                                        <span style={{
                                                            position: 'absolute',
                                                            height: '14px', width: '14px',
                                                            left: isDisabled ? '3px' : '19px',
                                                            bottom: '3px', backgroundColor: 'white',
                                                            borderRadius: '50%', transition: 'all 0.3s ease'
                                                        }} />
                                                    </span>
                                                </label>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        ) : (
                            <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                                <div style={{ fontSize: '40px', marginBottom: '12px', opacity: 0.3 }}>📅</div>
                                <p style={{ ...textStyle, color: '#999', marginBottom: '4px' }}>No schedule set for this day</p>
                                {(() => {
                                    const dayIdx = (selectedDate.getDay() + 6) % 7;
                                    const dayName = DAY_NAMES[dayIdx];
                                    const defaults = clinicHours?.[dayName];
                                    if (defaults && defaults.enabled) {
                                        return <p style={{ fontSize: '11px', color: '#8B7355' }}>Clinic default: {formatTimeDisplay(defaults.start)} – {formatTimeDisplay(defaults.end)}</p>;
                                    }
                                    if (defaults && !defaults.enabled) {
                                        return <p style={{ fontSize: '11px', color: '#bbb' }}>Clinic is closed on this day</p>;
                                    }
                                    return null;
                                })()}
                                <button
                                    onClick={() => openCreateModal()}
                                    style={{
                                        marginTop: '12px', padding: '8px 20px', borderRadius: '6px',
                                        border: '1px dashed #A89078', background: 'transparent',
                                        color: '#5D4E37', cursor: 'pointer', fontSize: '12px', fontWeight: '600'
                                    }}
                                >
                                    + Set Availability
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ===== Add/Edit Schedule Modal ===== */}
            {showModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
                    justifyContent: 'center', alignItems: 'center', zIndex: 2000
                }} onClick={() => setShowModal(false)}>
                    <div style={{
                        background: 'white', borderRadius: '16px', padding: '32px',
                        maxWidth: '480px', width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
                        fontFamily: 'Calibri, sans-serif'
                    }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ ...headerStyle, fontSize: '18px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <FaCalendarAlt /> {editingId ? 'Edit Schedule' : 'Add Schedule'}
                            </h3>
                            <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999', fontSize: '16px' }}><FaTimes /></button>
                        </div>

                        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <label style={labelStyle}>Date <span style={{ color: 'red' }}>*</span></label>
                                <input
                                    type="date"
                                    value={formData.schedule_date}
                                    onChange={e => setFormData({ ...formData, schedule_date: e.target.value })}
                                    min={todayStr}
                                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #E0D5C7', ...textStyle, boxSizing: 'border-box' }}
                                    required
                                />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div>
                                    <label style={labelStyle}>Start Time <span style={{ color: 'red' }}>*</span></label>
                                    <input
                                        type="time"
                                        value={formData.start_time}
                                        onChange={e => setFormData({ ...formData, start_time: e.target.value })}
                                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #E0D5C7', ...textStyle, boxSizing: 'border-box' }}
                                        required
                                    />
                                </div>
                                <div>
                                    <label style={labelStyle}>End Time <span style={{ color: 'red' }}>*</span></label>
                                    <input
                                        type="time"
                                        value={formData.end_time}
                                        onChange={e => setFormData({ ...formData, end_time: e.target.value })}
                                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #E0D5C7', ...textStyle, boxSizing: 'border-box' }}
                                        required
                                    />
                                </div>
                            </div>
                            {editingId && (
                                <div>
                                    <label style={labelStyle}>Status</label>
                                    <select
                                        value={formData.status}
                                        onChange={e => setFormData({ ...formData, status: e.target.value })}
                                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #E0D5C7', ...textStyle, boxSizing: 'border-box' }}
                                    >
                                        <option value="available">Available</option>
                                        <option value="unavailable">Unavailable</option>
                                    </select>
                                </div>
                            )}
                            <div style={{ backgroundColor: '#F9F5F0', padding: '10px 14px', borderRadius: '6px', fontSize: '11px', color: '#8B7355' }}>
                                💡 This schedule will generate 30-minute appointment slots (with 15-min breaks) for clients to book.
                            </div>
                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    style={{
                                        padding: '10px 24px', borderRadius: '8px', border: '1px solid #E0D5C7',
                                        background: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: '#666'
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    style={{
                                        padding: '10px 28px', borderRadius: '8px', border: 'none',
                                        backgroundColor: '#5D4E37', color: 'white', cursor: 'pointer',
                                        fontSize: '13px', fontWeight: '700', opacity: saving ? 0.6 : 1
                                    }}
                                >
                                    {saving ? 'Saving...' : (editingId ? 'Update Schedule' : 'Add Schedule')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DoctorSchedule;
