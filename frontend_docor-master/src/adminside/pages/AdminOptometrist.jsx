import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import { useNotification } from '../hooks/useNotification';
import './Dashboard.css';
import { FaUserMd, FaEnvelope, FaPhone, FaMapMarkerAlt, FaClock, FaCalendarAlt, FaChevronLeft, FaChevronRight, FaEdit, FaPlus, FaTrash, FaBirthdayCake } from 'react-icons/fa';

// Helper: format date as YYYY-MM-DD in local timezone (avoids UTC shift from toISOString)
const toLocalDateStr = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const FloatingMessage = ({ message, type, show }) => {
    if (!show) return null;
    const bgColor = type === 'success' ? '#2e7d32' : '#c62828';
    return (
        <div style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            backgroundColor: bgColor,
            color: 'white',
            padding: '15px 25px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 1000,
            animation: 'fadeIn 0.3s ease-in-out',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontFamily: 'Calibri, sans-serif'
        }}>
            <span style={{ fontWeight: 'bold' }}>{message}</span>
        </div>
    );
};

const AdminOptometrist = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    // --- State ---
    const [viewMode, setViewMode] = useState('month'); // 'month', 'week', 'day'
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());

    // Doctor Data State
    const [doctors, setDoctors] = useState([]);
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [loading, setLoading] = useState(false);

    // Appointments Data State
    const [appointments, setAppointments] = useState([]);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    // Schedule Data State
    const [schedules, setSchedules] = useState([]);
    const [scheduleLoading, setScheduleLoading] = useState(false);

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
    };

    // Modals State
    const [showDoctorModal, setShowDoctorModal] = useState(false);
    const [showEditDoctorModal, setShowEditDoctorModal] = useState(false);
    const [showAppointmentModal, setShowAppointmentModal] = useState(false);
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [isEditingAppointment, setIsEditingAppointment] = useState(false);
    const { showNotification, NotificationModal } = useNotification();

    // Form State
    const [doctorForm, setDoctorForm] = useState({
        full_name: '',
        email: '',
        specialization: '',
        position: '',
        birthday: '',
        bio: '',
        image: null,
        imagePreview: null
    });
    const [appointmentForm, setAppointmentForm] = useState({
        id: null,
        patient: '',
        time: '',
        type: 'Eye Exam',
        status: 'Pending'
    });
    const [scheduleForm, setScheduleForm] = useState({
        schedule_date: '',
        start_time: '09:00',
        end_time: '17:00',
    });

    useEffect(() => {
        if (id) fetchDoctorById();
    }, [id]);

    useEffect(() => {
        if (selectedDoctor) {
            fetchAppointments();
            fetchSchedules();
        }
    }, [selectedDoctor]);

    const fetchAppointments = async () => {
        if (!selectedDoctor) return;
        try {
            const response = await adminAPI.getDoctorAppointments(selectedDoctor.doctor_id);
            const appts = response.data.data || response.data || [];
            setAppointments(appts);
        } catch (error) {
            console.error('Error fetching appointments:', error);
            showToast('Failed to load appointments', 'error');
        }
    };

    const fetchDoctorById = async () => {
        try {
            setLoading(true);
            const response = await adminAPI.getDoctors();
            const doctorsData = response.data.data || response.data || [];
            const doc = doctorsData.find(d => String(d.doctor_id) === String(id));
            if (doc) {
                setDoctors(doctorsData);
                setSelectedDoctor(doc);
            } else {
                setDoctors([]);
                setSelectedDoctor(null);
            }
        } catch (error) {
            console.error('Error fetching doctor:', error);
            setDoctors([]);
        } finally {
            setLoading(false);
        }
    };

    // --- Schedule Handlers ---
    const fetchSchedules = async () => {
        if (!selectedDoctor) return;
        try {
            setScheduleLoading(true);
            const response = await adminAPI.getDoctorSchedules(selectedDoctor.doctor_id);
            const schedulesData = response.data.data || response.data || [];
            setSchedules(schedulesData);
        } catch (error) {
            console.error('Error fetching schedules:', error);
        } finally {
            setScheduleLoading(false);
        }
    };

    const handleAddSchedule = () => {
        setScheduleForm({
            schedule_date: '',
            start_time: '09:00',
            end_time: '17:00',
        });
        setShowScheduleModal(true);
    };

    const saveSchedule = async (e) => {
        e.preventDefault();
        if (!selectedDoctor) return;
        try {
            await adminAPI.createDoctorSchedule({
                doctor_id: selectedDoctor.doctor_id,
                schedule_date: scheduleForm.schedule_date,
                start_time: scheduleForm.start_time,
                end_time: scheduleForm.end_time,
            });
            setShowScheduleModal(false);
            fetchSchedules();
            showNotification('Schedule added successfully!', 'success');
        } catch (error) {
            console.error('Error saving schedule:', error);
            const msg = error.response?.data?.message || 'Failed to save schedule.';
            showNotification(msg, 'error');
        }
    };

    const handleDeleteSchedule = async (id) => {
        if (window.confirm('Delete this schedule?')) {
            try {
                await adminAPI.deleteDoctorSchedule(id);
                fetchSchedules();
                showToast('Schedule deleted', 'success');
            } catch (error) {
                console.error('Error deleting schedule:', error);
                showToast('Failed to delete schedule', 'error');
            }
        }
    };

    const formatTimeDisplay = (time) => {
        if (!time) return '';
        const [h, m] = time.split(':');
        const hour = parseInt(h);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const h12 = hour % 12 || 12;
        return `${h12}:${m} ${ampm}`;
    };

    // Helper to check if appointment is in the past
    const isAppointmentPast = (appointmentDate, appointmentTime) => {
        const now = new Date();
        const apptDateTime = new Date(`${appointmentDate} ${appointmentTime}`);
        return apptDateTime < now;
    };

    // --- Calendar Helpers ---
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

    // --- Doctor Handlers ---
    const handleAddDoctor = () => {
        setDoctorForm({
            full_name: '',
            email: '',
            specialization: '',
            position: '',
            birthday: '',
            bio: '',
            image: null,
            imagePreview: null
        });
        setShowDoctorModal(true);
    };

    const handleDoctorImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setDoctorForm({
                ...doctorForm,
                image: file,
                imagePreview: URL.createObjectURL(file)
            });
        }
    };

    const saveDoctor = async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            formData.append('full_name', doctorForm.full_name);
            formData.append('email', doctorForm.email || '');
            formData.append('specialization', doctorForm.specialization);
            formData.append('position', doctorForm.position || '');
            formData.append('birthday', doctorForm.birthday || '');
            formData.append('bio', doctorForm.bio || '');
            if (doctorForm.image) {
                formData.append('image', doctorForm.image);
            }

            await adminAPI.createDoctor(formData);
            await fetchDoctors();
            setShowDoctorModal(false);
            showNotification('Doctor added successfully!', 'success');
        } catch (error) {
            console.error('Error saving doctor:', error);
            showNotification('Failed to save doctor.', 'error');
        }
    };

    // --- Edit Doctor Handlers ---
    const handleEditDoctor = () => {
        if (!selectedDoctor) return;
        setDoctorForm({
            full_name: selectedDoctor.full_name || '',
            email: selectedDoctor.email || '',
            specialization: selectedDoctor.specialization || '',
            position: selectedDoctor.position || '',
            birthday: selectedDoctor.birthday || '',
            bio: selectedDoctor.bio || '',
            image: null,
            imagePreview: selectedDoctor.image || null
        });
        setShowEditDoctorModal(true);
    };

    const updateDoctor = async (e) => {
        e.preventDefault();
        if (!selectedDoctor) return;

        try {
            const formData = new FormData();
            formData.append('full_name', doctorForm.full_name);
            formData.append('email', doctorForm.email || '');
            formData.append('specialization', doctorForm.specialization);
            formData.append('position', doctorForm.position || '');
            formData.append('birthday', doctorForm.birthday || '');
            formData.append('bio', doctorForm.bio || '');
            if (doctorForm.image) {
                formData.append('image', doctorForm.image);
            }

            await adminAPI.updateDoctor(selectedDoctor.doctor_id, formData);
            await fetchDoctors();
            setShowEditDoctorModal(false);
            showNotification('Doctor updated successfully!', 'success');
        } catch (error) {
            console.error('Error updating doctor:', error);
            showNotification('Failed to update doctor.', 'error');
        }
    };

    // --- Appointment Handlers ---


    const handleEditAppointment = (appt) => {
        setAppointmentForm({ ...appt });
        setIsEditingAppointment(true);
        setShowAppointmentModal(true);
    };

    const handleDeleteAppointment = async (id) => {
        if (window.confirm('Are you sure you want to delete this appointment?')) {
            try {
                await adminAPI.deleteAppointment(id);
                fetchAppointments();
                showToast('Appointment deleted successfully', 'success');
            } catch (error) {
                console.error('Error deleting appointment:', error);
                showToast('Failed to delete appointment', 'error');
            }
        }
    };

    const saveAppointment = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                // For simplified handling, we are mostly updating status/time/type
                // Adding a new appointment here is tricky without patient selector, 
                // but we will support basic update which is the primary use case here.
                appointment_time: appointmentForm.time,
                status: appointmentForm.status,
                // We need to map 'type' (name) back to ID if possible or just ignore for now if backend doesn't support name.
                // But AppointmentController expects IDs. 
                // For this task, we assume we are updating existing appointments mostly.
                notes: appointmentForm.notes || `Updated appointment for ${appointmentForm.patient}`,
                doctor_id: selectedDoctor.doctor_id,
                appointment_date: toLocalDateStr(selectedDate) // Use YYYY-MM-DD in local timezone
            };

            if (isEditingAppointment && appointmentForm.appointment_id) {
                await adminAPI.updateAppointment(appointmentForm.appointment_id, payload);
                showToast('Appointment updated successfully', 'success');
            } else {
                // Creating new - might fail without patient_id but we try
                await adminAPI.createAppointment(payload);
                showToast('Appointment created successfully', 'success');
            }
            fetchAppointments();
            setShowAppointmentModal(false);
        } catch (error) {
            console.error('Error saving appointment:', error);
            showToast('Failed to save appointment', 'error');
        }
    };

    // --- Renderers ---

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
                    const dayDateStr = `${dayDate.getFullYear()}-${String(dayDate.getMonth() + 1).padStart(2, '0')}-${String(dayDate.getDate()).padStart(2, '0')}`; // YYYY-MM-DD in local timezone
                    const isSelected = selectedDate.getDate() === day && selectedDate.getMonth() === currentDate.getMonth() && selectedDate.getFullYear() === currentDate.getFullYear();
                    const isToday = new Date().getDate() === day && new Date().getMonth() === currentDate.getMonth() && new Date().getFullYear() === currentDate.getFullYear();

                    // Check for appointments on this day
                    const dayAppointments = appointments.filter(a => a.appointment_date === dayDateStr);
                    const appointmentCount = dayAppointments.length;
                    const hasPastAppt = dayAppointments.some(a => isAppointmentPast(a.appointment_date, a.appointment_time));
                    const hasFutureAppt = dayAppointments.some(a => !isAppointmentPast(a.appointment_date, a.appointment_time));

                    // Determine background color based on appointments
                    let bgColor = '#f9f9f9';
                    if (isSelected) {
                        bgColor = '#5D4E37';
                    } else if (isToday) {
                        bgColor = '#E0D5C7';
                    } else if (appointmentCount > 0) {
                        // Shade the date if it has appointments
                        if (hasPastAppt && hasFutureAppt) {
                            // Mixed: use gradient or lighter shade
                            bgColor = 'linear-gradient(135deg, #F5E6D3 50%, #E8D5C0 50%)';
                        } else if (hasPastAppt) {
                            // Past appointments only: light brown
                            bgColor = '#F5E6D3';
                        } else {
                            // Future appointments only: darker beige
                            bgColor = '#E8D5C0';
                        }
                    }

                    return (
                        <div
                            key={day}
                            onClick={() => handleDateClick(day)}
                            style={{
                                padding: '10px',
                                textAlign: 'center',
                                borderRadius: '8px',
                                cursor: appointmentCount > 0 || isToday ? 'pointer' : 'default',
                                background: bgColor,
                                color: isSelected ? 'white' : '#333',
                                border: appointmentCount > 0 ? '2px solid #A89078' : '1px solid #eee',
                                fontSize: '12px',
                                minHeight: '70px',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'flex-start',
                                alignItems: 'center',
                                position: 'relative',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                                if (appointmentCount > 0) {
                                    e.currentTarget.style.transform = 'scale(1.05)';
                                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'scale(1)';
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                        >
                            <span style={{ fontWeight: 'bold', fontSize: '14px' }}>{day}</span>

                            {/* Show appointment count if > 0 */}
                            {appointmentCount > 0 && (
                                <div style={{
                                    marginTop: '4px',
                                    padding: '2px 6px',
                                    borderRadius: '10px',
                                    backgroundColor: isSelected ? 'rgba(255,255,255,0.3)' : '#5D4E37',
                                    color: isSelected ? 'white' : 'white',
                                    fontSize: '10px',
                                    fontWeight: 'bold'
                                }}>
                                    {appointmentCount} {appointmentCount === 1 ? 'appt' : 'appts'}
                                </div>
                            )}

                            {/* Show indicators for past/future */}
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
                                padding: '10px',
                                textAlign: 'center',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                backgroundColor: isSelected ? '#5D4E37' : '#f9f9f9',
                                color: isSelected ? 'white' : '#333',
                                border: '1px solid #eee',
                                minHeight: '100px'
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
        const hours = Array.from({ length: 9 }, (_, i) => i + 9); // 9 AM to 5 PM
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
                                    <div onClick={() => handleEditAppointment(appt)} style={{ cursor: 'pointer' }}>
                                        <div style={{ fontWeight: 'bold', fontSize: '12px', color: isPast ? '#A89078' : '#2e7d32' }}>
                                            {appt.patient?.name || appt.clientAccount?.first_name + ' ' + appt.clientAccount?.last_name || 'Patient'}
                                        </div>
                                        <div style={{ fontSize: '11px', color: '#555' }}>
                                            {appt.service?.name || appt.appointment_type || 'Appointment'}
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

    // --- Styles ---
    const fontStyle = { fontFamily: 'Calibri, sans-serif' };
    const headerStyle = { ...fontStyle, fontSize: '15px', fontWeight: 'bold', color: '#5D4E37' };
    const textStyle = { ...fontStyle, fontSize: '12px', color: '#555' };

    const todayStr = toLocalDateStr(new Date());
    const todaysAppointments = appointments.filter(a => a.appointment_date === todayStr);

    if (loading) return <div className="dashboard-loading"><div className="spinner"></div></div>;

    return (
        <div className="dashboard" style={fontStyle}>
            <FloatingMessage
                message={toast.message}
                type={toast.type}
                show={toast.show}
            />
            <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <button
                        onClick={() => navigate('/admin/dashboard/optometrist')}
                        style={{
                            background: 'none',
                            border: '1px solid #E0D5C7',
                            borderRadius: '8px',
                            padding: '8px 16px',
                            cursor: 'pointer',
                            color: '#5D4E37',
                            fontSize: '13px',
                            fontWeight: '600',
                            fontFamily: 'Calibri, sans-serif',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                        }}
                    >
                        ← Back to Doctors
                    </button>
                    <div>
                        <h1 style={{ fontFamily: 'Calibri, sans-serif', marginBottom: '5px' }}>
                            Doctor Management
                        </h1>
                        <p className="dashboard-subtitle">Manage doctor profile and appointment schedules</p>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px' }}>

                {/* Left Column: Profile */}
                <div className="chart-container" style={{ padding: '30px', textAlign: 'center', position: 'relative' }}>
                    {selectedDoctor ? (
                        <>
                            {/* Edit Icon */}
                            <button
                                onClick={handleEditDoctor}
                                style={{
                                    position: 'absolute',
                                    top: '15px',
                                    right: '15px',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: '#5D4E37',
                                    fontSize: '16px'
                                }}
                                title="Edit Doctor Profile"
                            >
                                <FaEdit />
                            </button>

                            <div style={{
                                width: '120px',
                                height: '120px',
                                borderRadius: '50%',
                                overflow: 'hidden',
                                margin: '0 auto 20px',
                                border: '4px solid #E0D5C7'
                            }}>
                                <img src={selectedDoctor.image || 'https://via.placeholder.com/150'} alt={selectedDoctor.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                            <h2 style={{ ...headerStyle, fontSize: '18px', marginBottom: '5px' }}>{selectedDoctor.full_name}</h2>
                            <p style={{ ...textStyle, fontWeight: 'bold', color: '#8B7355', marginBottom: '15px' }}>{selectedDoctor.specialization}</p>

                            <div style={{ textAlign: 'left', marginTop: '20px' }}>
                                {selectedDoctor.email && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                                        <FaEnvelope style={{ color: '#8B7355', fontSize: '12px' }} />
                                        <span style={textStyle}>{selectedDoctor.email}</span>
                                    </div>
                                )}
                                {selectedDoctor.position && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                                        <FaUserMd style={{ color: '#8B7355', fontSize: '12px' }} />
                                        <span style={textStyle}>{selectedDoctor.position}</span>
                                    </div>
                                )}
                                {selectedDoctor.birthday && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <FaBirthdayCake style={{ color: '#8B7355', fontSize: '12px' }} />
                                        <span style={textStyle}>{new Date(selectedDoctor.birthday).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} (Age: {selectedDoctor.age})</span>
                                    </div>
                                )}
                            </div>

                            {selectedDoctor.bio && (
                                <div style={{ marginTop: '20px', textAlign: 'left' }}>
                                    <h3 style={{ ...headerStyle, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <FaUserMd /> Bio
                                    </h3>
                                    <p style={{ ...textStyle, lineHeight: '1.5' }}>{selectedDoctor.bio}</p>
                                </div>
                            )}
                        </>
                    ) : (
                        <div style={{ padding: '40px', textAlign: 'center' }}>
                            <p style={{ ...textStyle, color: '#999' }}>No doctor selected. Click "Add Doctor" to add a new doctor.</p>
                        </div>
                    )}

                    {/* ---- Schedule Management Section ---- */}
                    {selectedDoctor && (
                        <div style={{ marginTop: '25px', borderTop: '1px solid #E0D5C7', paddingTop: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                <h3 style={{ ...headerStyle, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                                    <FaCalendarAlt /> Schedules
                                </h3>
                                <button
                                    onClick={handleAddSchedule}
                                    style={{
                                        backgroundColor: '#5D4E37',
                                        color: 'white',
                                        border: 'none',
                                        padding: '6px 12px',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontSize: '11px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '5px'
                                    }}
                                >
                                    <FaPlus /> Add
                                </button>
                            </div>

                            {scheduleLoading ? (
                                <p style={{ ...textStyle, color: '#999', textAlign: 'center' }}>Loading...</p>
                            ) : schedules.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '250px', overflowY: 'auto' }}>
                                    {schedules.map(sch => (
                                        <div key={sch.docsched_id} style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '10px 12px',
                                            backgroundColor: '#F9F5F0',
                                            borderRadius: '8px',
                                            borderLeft: '3px solid #5D4E37'
                                        }}>
                                            <div>
                                                <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#5D4E37' }}>
                                                    {new Date(sch.schedule_date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                                                </div>
                                                <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>
                                                    {formatTimeDisplay(sch.start_time)} — {formatTimeDisplay(sch.end_time)}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteSchedule(sch.docsched_id)}
                                                style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#c62828', fontSize: '13px' }}
                                                title="Delete schedule"
                                            >
                                                <FaTrash />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p style={{ ...textStyle, color: '#999', textAlign: 'center', fontStyle: 'italic', padding: '10px 0' }}>
                                    No upcoming schedules set.
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* Right Column: Calendar & Schedule */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                    {/* Calendar Control */}
                    <div className="chart-container" style={{ padding: '20px' }}>
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

                        {/* Calendar Grid */}
                        {viewMode === 'month' && renderMonthView()}
                        {viewMode === 'week' && renderWeekView()}
                        {viewMode === 'day' && renderDayView()}
                    </div>

                    {/* Schedule Cards Section */}
                    <div className="chart-container" style={{ padding: '20px', flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                            <h3 style={{ ...headerStyle, display: 'flex', alignItems: 'center', gap: '10px' }}>
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
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '15px',
                                            backgroundColor: bgColor,
                                            borderRadius: '8px',
                                            borderLeft: `4px solid ${borderColor}`,
                                            boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
                                        }}>
                                            <div>
                                                <div style={{ ...headerStyle, fontSize: '14px' }}>
                                                    {appt.appointment_time} - {appt.service?.name || appt.appointment_type || 'Appointment'}
                                                </div>
                                                <div style={textStyle}>
                                                    Patient: {appt.patient?.name || appt.clientAccount?.first_name + ' ' + appt.clientAccount?.last_name || 'N/A'}
                                                </div>
                                                {isPast && <div style={{ fontSize: '10px', color: '#A89078', fontStyle: 'italic', marginTop: '4px' }}>Past Appointment</div>}
                                            </div>
                                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                                <div style={{
                                                    padding: '4px 10px',
                                                    borderRadius: '12px',
                                                    backgroundColor:
                                                        appt.status?.toLowerCase() === 'approved' || appt.status?.toLowerCase() === 'confirmed' ? '#e8f5e9' :
                                                            appt.status?.toLowerCase() === 'completed' ? '#e3f2fd' :
                                                                appt.status?.toLowerCase() === 'ongoing' ? '#fff9c4' :
                                                                    appt.status?.toLowerCase() === 'cancelled' ? '#ffebee' : '#fff3e0',
                                                    color:
                                                        appt.status?.toLowerCase() === 'approved' || appt.status?.toLowerCase() === 'confirmed' ? '#2e7d32' :
                                                            appt.status?.toLowerCase() === 'completed' ? '#1976d2' :
                                                                appt.status?.toLowerCase() === 'ongoing' ? '#f57f17' :
                                                                    appt.status?.toLowerCase() === 'cancelled' ? '#c62828' : '#f57c00',
                                                    fontSize: '11px',
                                                    fontWeight: 'bold'
                                                }}>
                                                    {appt.status}
                                                </div>
                                                <button onClick={() => handleEditAppointment(appt)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#5D4E37' }}><FaEdit /></button>
                                                <button onClick={() => handleDeleteAppointment(appt.appointment_id)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#c62828' }}><FaTrash /></button>
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

                </div>
            </div>

            {/* Appointments Today Section */}
            <div className="chart-container" style={{ marginTop: '30px', padding: '20px' }}>
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
                                    <th style={{ padding: '10px' }}>Type</th>
                                    <th style={{ padding: '10px' }}>Status</th>
                                    <th style={{ padding: '10px' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {todaysAppointments.map(appt => (
                                    <tr key={appt.appointment_id} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={{ padding: '10px' }}>{appt.appointment_time}</td>
                                        <td style={{ padding: '10px', fontWeight: 'bold' }}>
                                            {appt.patient?.name || appt.clientAccount?.first_name + ' ' + appt.clientAccount?.last_name || 'N/A'}
                                        </td>
                                        <td style={{ padding: '10px' }}>{appt.service?.name || appt.appointment_type || 'Appointment'}</td>
                                        <td style={{ padding: '10px' }}>
                                            <span style={{
                                                padding: '2px 8px',
                                                borderRadius: '10px',
                                                backgroundColor:
                                                    appt.status?.toLowerCase() === 'approved' || appt.status?.toLowerCase() === 'confirmed' ? '#e8f5e9' :
                                                        appt.status?.toLowerCase() === 'completed' ? '#e3f2fd' :
                                                            appt.status?.toLowerCase() === 'ongoing' ? '#fff9c4' :
                                                                appt.status?.toLowerCase() === 'cancelled' ? '#ffebee' : '#fff3e0',
                                                color:
                                                    appt.status?.toLowerCase() === 'approved' || appt.status?.toLowerCase() === 'confirmed' ? '#2e7d32' :
                                                        appt.status?.toLowerCase() === 'completed' ? '#1976d2' :
                                                            appt.status?.toLowerCase() === 'ongoing' ? '#f57f17' :
                                                                appt.status?.toLowerCase() === 'cancelled' ? '#c62828' : '#f57c00',
                                                fontSize: '10px'
                                            }}>
                                                {appt.status}
                                            </span>
                                        </td>
                                        <td style={{ padding: '10px' }}>
                                            <button onClick={() => handleEditAppointment(appt)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#5D4E37', marginRight: '5px' }}>Edit</button>
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

            {/* --- Add Doctor Modal --- */}
            {showDoctorModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <h3 style={{ ...headerStyle, marginBottom: '20px' }}>Add New Doctor</h3>
                        <form onSubmit={saveDoctor} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>

                            {/* Image Upload */}
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ width: '100px', height: '100px', borderRadius: '50%', overflow: 'hidden', margin: '0 auto 10px', border: '2px solid #E0D5C7' }}>
                                    <img src={doctorForm.imagePreview || 'https://via.placeholder.com/150'} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </div>
                                <input type="file" accept="image/*" onChange={handleDoctorImageChange} style={{ fontSize: '12px' }} />
                            </div>

                            {/* Full Name */}
                            <div>
                                <label style={{ ...textStyle, marginBottom: '5px', display: 'block', fontWeight: 'bold' }}>
                                    Full Name <span style={{ color: 'red' }}>*</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="Enter full name"
                                    value={doctorForm.full_name}
                                    onChange={e => setDoctorForm({ ...doctorForm, full_name: e.target.value })}
                                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #E0D5C7', ...textStyle }}
                                    required
                                />
                            </div>

                            {/* Email */}
                            <div>
                                <label style={{ ...textStyle, marginBottom: '5px', display: 'block', fontWeight: 'bold' }}>Email</label>
                                <input
                                    type="email"
                                    placeholder="Enter email address"
                                    value={doctorForm.email}
                                    onChange={e => setDoctorForm({ ...doctorForm, email: e.target.value })}
                                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #E0D5C7', ...textStyle }}
                                />
                            </div>

                            {/* Specialization */}
                            <div>
                                <label style={{ ...textStyle, marginBottom: '5px', display: 'block', fontWeight: 'bold' }}>
                                    Specialization <span style={{ color: 'red' }}>*</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g., Optometrist"
                                    value={doctorForm.specialization}
                                    onChange={e => setDoctorForm({ ...doctorForm, specialization: e.target.value })}
                                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #E0D5C7', ...textStyle }}
                                    required
                                />
                            </div>

                            {/* Position */}
                            <div>
                                <label style={{ ...textStyle, marginBottom: '5px', display: 'block', fontWeight: 'bold' }}>Position</label>
                                <input
                                    type="text"
                                    placeholder="e.g., Senior Optometrist"
                                    value={doctorForm.position}
                                    onChange={e => setDoctorForm({ ...doctorForm, position: e.target.value })}
                                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #E0D5C7', ...textStyle }}
                                />
                            </div>

                            {/* Birthday */}
                            <div>
                                <label style={{ ...textStyle, marginBottom: '5px', display: 'block', fontWeight: 'bold' }}>Birthday</label>
                                <input
                                    type="date"
                                    value={doctorForm.birthday}
                                    onChange={e => setDoctorForm({ ...doctorForm, birthday: e.target.value })}
                                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #E0D5C7', ...textStyle }}
                                />
                            </div>

                            {/* Bio */}
                            <div>
                                <label style={{ ...textStyle, marginBottom: '5px', display: 'block', fontWeight: 'bold' }}>Bio</label>
                                <textarea
                                    placeholder="Enter doctor's biography..."
                                    value={doctorForm.bio}
                                    onChange={e => setDoctorForm({ ...doctorForm, bio: e.target.value })}
                                    rows="4"
                                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #E0D5C7', ...textStyle, resize: 'vertical' }}
                                />
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="modal-btn cancel" onClick={() => setShowDoctorModal(false)}>Cancel</button>
                                <button type="submit" className="modal-btn confirm" style={{ backgroundColor: '#5D4E37' }}>Add Doctor</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- Edit Doctor Modal --- */}
            {showEditDoctorModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <h3 style={{ ...headerStyle, marginBottom: '20px' }}>Edit Doctor Profile</h3>
                        <form onSubmit={updateDoctor} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>

                            {/* Image Upload */}
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ width: '100px', height: '100px', borderRadius: '50%', overflow: 'hidden', margin: '0 auto 10px', border: '2px solid #E0D5C7' }}>
                                    <img src={doctorForm.imagePreview || 'https://via.placeholder.com/150'} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </div>
                                <input type="file" accept="image/*" onChange={handleDoctorImageChange} style={{ fontSize: '12px' }} />
                                <p style={{ fontSize: '10px', color: '#999', marginTop: '5px' }}>Leave empty to keep current image</p>
                            </div>

                            {/* Full Name */}
                            <div>
                                <label style={{ ...textStyle, marginBottom: '5px', display: 'block', fontWeight: 'bold' }}>
                                    Full Name <span style={{ color: 'red' }}>*</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="Enter full name"
                                    value={doctorForm.full_name}
                                    onChange={e => setDoctorForm({ ...doctorForm, full_name: e.target.value })}
                                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #E0D5C7', ...textStyle }}
                                    required
                                />
                            </div>

                            {/* Email */}
                            <div>
                                <label style={{ ...textStyle, marginBottom: '5px', display: 'block', fontWeight: 'bold' }}>Email</label>
                                <input
                                    type="email"
                                    placeholder="Enter email address"
                                    value={doctorForm.email}
                                    onChange={e => setDoctorForm({ ...doctorForm, email: e.target.value })}
                                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #E0D5C7', ...textStyle }}
                                />
                            </div>

                            {/* Specialization */}
                            <div>
                                <label style={{ ...textStyle, marginBottom: '5px', display: 'block', fontWeight: 'bold' }}>
                                    Specialization <span style={{ color: 'red' }}>*</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g., Optometrist"
                                    value={doctorForm.specialization}
                                    onChange={e => setDoctorForm({ ...doctorForm, specialization: e.target.value })}
                                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #E0D5C7', ...textStyle }}
                                    required
                                />
                            </div>

                            {/* Position */}
                            <div>
                                <label style={{ ...textStyle, marginBottom: '5px', display: 'block', fontWeight: 'bold' }}>Position</label>
                                <input
                                    type="text"
                                    placeholder="e.g., Senior Optometrist"
                                    value={doctorForm.position}
                                    onChange={e => setDoctorForm({ ...doctorForm, position: e.target.value })}
                                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #E0D5C7', ...textStyle }}
                                />
                            </div>

                            {/* Birthday */}
                            <div>
                                <label style={{ ...textStyle, marginBottom: '5px', display: 'block', fontWeight: 'bold' }}>Birthday</label>
                                <input
                                    type="date"
                                    value={doctorForm.birthday}
                                    onChange={e => setDoctorForm({ ...doctorForm, birthday: e.target.value })}
                                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #E0D5C7', ...textStyle }}
                                />
                            </div>

                            {/* Bio */}
                            <div>
                                <label style={{ ...textStyle, marginBottom: '5px', display: 'block', fontWeight: 'bold' }}>Bio</label>
                                <textarea
                                    placeholder="Enter doctor's biography..."
                                    value={doctorForm.bio}
                                    onChange={e => setDoctorForm({ ...doctorForm, bio: e.target.value })}
                                    rows="4"
                                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #E0D5C7', ...textStyle, resize: 'vertical' }}
                                />
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="modal-btn cancel" onClick={() => setShowEditDoctorModal(false)}>Cancel</button>
                                <button type="submit" className="modal-btn confirm" style={{ backgroundColor: '#5D4E37' }}>Update Doctor</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- Add/Edit Appointment Modal --- */}
            {showAppointmentModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '400px' }}>
                        <h3 style={{ ...headerStyle, marginBottom: '20px' }}>{isEditingAppointment ? 'Edit Appointment' : 'Add Appointment'}</h3>
                        <form onSubmit={saveAppointment} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <input type="text" placeholder="Patient Name" value={appointmentForm.patient} onChange={e => setAppointmentForm({ ...appointmentForm, patient: e.target.value })} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #E0D5C7', ...textStyle }} required />
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                <input type="time" value={appointmentForm.time} onChange={e => setAppointmentForm({ ...appointmentForm, time: e.target.value })} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #E0D5C7', ...textStyle }} required />
                                <select value={appointmentForm.status} onChange={e => setAppointmentForm({ ...appointmentForm, status: e.target.value })} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #E0D5C7', ...textStyle }}>
                                    <option value="Pending">Pending</option>
                                    <option value="Confirmed">Confirmed</option>
                                    <option value="Completed">Completed</option>
                                    <option value="Cancelled">Cancelled</option>
                                </select>
                            </div>
                            <select value={appointmentForm.type} onChange={e => setAppointmentForm({ ...appointmentForm, type: e.target.value })} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #E0D5C7', ...textStyle }}>
                                <option value="Eye Exam">Eye Exam</option>
                                <option value="Consultation">Consultation</option>
                                <option value="Contact Lens">Contact Lens</option>
                                <option value="Therapy">Therapy</option>
                            </select>

                            <div className="modal-actions">
                                <button type="button" className="modal-btn cancel" onClick={() => setShowAppointmentModal(false)}>Cancel</button>
                                <button type="submit" className="modal-btn confirm" style={{ backgroundColor: '#5D4E37' }}>Save Appointment</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- Add Schedule Modal --- */}
            {showScheduleModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '420px' }}>
                        <h3 style={{ ...headerStyle, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FaCalendarAlt /> Add Schedule for {selectedDoctor?.full_name}
                        </h3>
                        <form onSubmit={saveSchedule} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <div>
                                <label style={{ ...textStyle, marginBottom: '5px', display: 'block', fontWeight: 'bold' }}>
                                    Date <span style={{ color: 'red' }}>*</span>
                                </label>
                                <input
                                    type="date"
                                    value={scheduleForm.schedule_date}
                                    onChange={e => setScheduleForm({ ...scheduleForm, schedule_date: e.target.value })}
                                    min={toLocalDateStr(new Date())}
                                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #E0D5C7', ...textStyle }}
                                    required
                                />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                <div>
                                    <label style={{ ...textStyle, marginBottom: '5px', display: 'block', fontWeight: 'bold' }}>
                                        Start Time <span style={{ color: 'red' }}>*</span>
                                    </label>
                                    <input
                                        type="time"
                                        value={scheduleForm.start_time}
                                        onChange={e => setScheduleForm({ ...scheduleForm, start_time: e.target.value })}
                                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #E0D5C7', ...textStyle }}
                                        required
                                    />
                                </div>
                                <div>
                                    <label style={{ ...textStyle, marginBottom: '5px', display: 'block', fontWeight: 'bold' }}>
                                        End Time <span style={{ color: 'red' }}>*</span>
                                    </label>
                                    <input
                                        type="time"
                                        value={scheduleForm.end_time}
                                        onChange={e => setScheduleForm({ ...scheduleForm, end_time: e.target.value })}
                                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #E0D5C7', ...textStyle }}
                                        required
                                    />
                                </div>
                            </div>
                            <div style={{ backgroundColor: '#F9F5F0', padding: '10px 14px', borderRadius: '6px', fontSize: '11px', color: '#8B7355' }}>
                                💡 This schedule will generate 30-minute appointment slots for clients to book.
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="modal-btn cancel" onClick={() => setShowScheduleModal(false)}>Cancel</button>
                                <button type="submit" className="modal-btn confirm" style={{ backgroundColor: '#5D4E37' }}>Add Schedule</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {NotificationModal}
        </div>
    );
};

export default AdminOptometrist;
