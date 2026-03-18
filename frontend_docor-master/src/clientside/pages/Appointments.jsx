import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import clientAuthService from '../../services/clientAuthService';
import api from '../../config/api.config';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import CustomSelect from '../components/CustomSelect';
import checkUpBg from '../../assets/check-up.jpg';

// Helper: format date as YYYY-MM-DD in local timezone (avoids UTC shift from toISOString)
const toLocalDateStr = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const Appointments = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { user } = useAuth();
    const [services, setServices] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [doctorSchedules, setDoctorSchedules] = useState([]);
    const [schedulesLoading, setSchedulesLoading] = useState(false);
    const [availableSlots, setAvailableSlots] = useState([]);
    const [slotsLoading, setSlotsLoading] = useState(false);
    const [slotsMessage, setSlotsMessage] = useState('');
    const [fullyBookedDates, setFullyBookedDates] = useState(new Set());
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        birthday: '',
        gender: '',
        occupation: '',
        date: '',
        time: '',
        type: 'In-Person',
        service: '',
        doctor: '',
        reason: '',
    });

    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [loading, setLoading] = useState(false);

    // Pre-fill form with logged-in user's details
    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                fullName: prev.fullName || [user.first_name, user.last_name].filter(Boolean).join(' ').trim() || '',
                email: prev.email || user.email || '',
                phone: prev.phone || user.phone || '',
                gender: prev.gender || user.gender || '',
                birthday: prev.birthday || user.birthday || '',
            }));
        }
    }, [user]);

    // Fetch services and doctors on mount
    useEffect(() => {
        fetchServices();
        fetchDoctors();
    }, []);

    // Pre-select service from URL query param (e.g., coming from Services page)
    useEffect(() => {
        const serviceParam = searchParams.get('service');
        if (serviceParam && services.length > 0) {
            setFormData(prev => ({ ...prev, service: serviceParam }));
        }
    }, [searchParams, services]);

    // Fetch doctor schedules when doctor changes
    useEffect(() => {
        if (formData.doctor) {
            fetchDoctorSchedules(formData.doctor);
        } else {
            setDoctorSchedules([]);
        }
        // Reset date, time, slots, and fully-booked tracking when doctor changes
        setFormData(prev => ({ ...prev, date: '', time: '' }));
        setAvailableSlots([]);
        setSlotsMessage('');
        setFullyBookedDates(new Set());
    }, [formData.doctor]);

    // Fetch available slots when date changes (and doctor is set)
    useEffect(() => {
        if (formData.doctor && formData.date) {
            fetchAvailableSlots(formData.doctor, formData.date);
        } else {
            setAvailableSlots([]);
            setSlotsMessage('');
        }
        // Reset time when date changes
        setFormData(prev => ({ ...prev, time: '' }));
    }, [formData.date]);

    const fetchServices = async () => {
        try {
            const response = await axios.get(`${api.BASE_URL}/services`);
            const servicesData = response.data.data || response.data || [];
            setServices(servicesData);
        } catch (error) {
            console.error('Error fetching services:', error);
        }
    };

    const fetchDoctors = async () => {
        try {
            const response = await axios.get(`${api.BASE_URL}/doctors`);
            const doctorsData = response.data.data || response.data || [];
            // Only show on-duty doctors
            const activeDoctors = doctorsData.filter(d => d.status === 'on-duty');
            setDoctors(activeDoctors);
        } catch (error) {
            console.error('Error fetching doctors:', error);
        }
    };

    const fetchDoctorSchedules = async (doctorId) => {
        try {
            setSchedulesLoading(true);
            const response = await axios.get(`${api.BASE_URL}/doctors/${doctorId}/schedules`);
            const data = response.data.data || response.data || [];
            // Only show future schedules (today or later)
            const today = toLocalDateStr(new Date());
            const futureSchedules = data.filter(s => s.schedule_date >= today && s.status === 'available');
            // Sort by date
            futureSchedules.sort((a, b) => a.schedule_date.localeCompare(b.schedule_date));
            setDoctorSchedules(futureSchedules);

            // Check each date's availability in background
            for (const sch of futureSchedules) {
                try {
                    const slotsRes = await axios.get(
                        `${api.BASE_URL}/doctors/${doctorId}/available-slots?date=${sch.schedule_date}`
                    );
                    const slotsData = slotsRes.data.data || {};
                    if (slotsData.fully_booked) {
                        setFullyBookedDates(prev => new Set([...prev, sch.schedule_date]));
                    }
                } catch (e) { /* ignore individual failures */ }
            }
        } catch (error) {
            console.error('Error fetching doctor schedules:', error);
            setDoctorSchedules([]);
        } finally {
            setSchedulesLoading(false);
        }
    };

    const formatScheduleDate = (dateStr) => {
        const date = new Date(dateStr + 'T00:00:00');
        return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    };

    const formatTime12h = (time) => {
        if (!time) return '';
        const [h, m] = time.split(':');
        const hour = parseInt(h);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const h12 = hour % 12 || 12;
        return `${h12}:${m} ${ampm}`;
    };

    const selectScheduleDate = (dateStr) => {
        setFormData(prev => ({ ...prev, date: dateStr }));
    };

    const fetchAvailableSlots = async (doctorId, date) => {
        try {
            setSlotsLoading(true);
            setSlotsMessage('');
            setAvailableSlots([]);

            const response = await axios.get(
                `${api.BASE_URL}/doctors/${doctorId}/available-slots?date=${date}`
            );

            const data = response.data.data || {};
            const slots = data.slots || [];

            if (data.fully_booked) {
                setSlotsMessage('This date is fully booked.');
                setFullyBookedDates(prev => new Set([...prev, date]));
            } else if (slots.length === 0) {
                setSlotsMessage(data.message || 'No available slots for this date.');
            } else {
                setAvailableSlots(slots);
            }
        } catch (error) {
            console.error('Error fetching slots:', error);
            setSlotsMessage('Could not load available times.');
        } finally {
            setSlotsLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const selectTimeSlot = (time) => {
        setFormData(prev => ({ ...prev, time }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!user) {
            alert('Please log in to book an appointment.');
            navigate('/login');
            return;
        }

        if (!formData.fullName || !formData.email || !formData.date || !formData.time || !formData.doctor) {
            alert('Please fill in all required fields.');
            return;
        }
        setShowConfirmModal(true);
    };

    const confirmAppointment = async () => {
        try {
            setLoading(true);
            setShowConfirmModal(false);

            const appointmentData = {
                appointment_date: formData.date,
                appointment_time: formData.time,
                appointment_type: formData.type === 'In-Person' ? 'in-person' : 'online',
                service_id: formData.service || null,
                doctor_id: formData.doctor || null,
                notes: formData.reason,
                occupation: formData.occupation || null,
                birthday: formData.birthday || null,
                full_name: formData.fullName || null,
                email: formData.email || null,
                phone: formData.phone || null,
                gender: formData.gender || null,
                status: 'pending'
            };

            await clientAuthService.createAppointment(appointmentData);

            setLoading(false);
            setShowSuccessModal(true);

            setFormData({
                fullName: '',
                email: '',
                phone: '',
                birthday: '',
                gender: '',
                occupation: '',
                date: '',
                time: '',
                type: 'In-Person',
                service: '',
                doctor: '',
                reason: '',
            });
            setAvailableSlots([]);
        } catch (error) {
            setLoading(false);
            console.error('Error booking appointment:', error);
            alert('Failed to book appointment. Please try again.');
        }
    };

    const cancelAppointment = () => {
        setShowConfirmModal(false);
    };

    // Get today's date for min date
    const today = toLocalDateStr(new Date());

    // Get selected doctor name for confirmation modal
    const selectedDoctor = doctors.find(d => String(d.doctor_id || d.id) === String(formData.doctor));

    return (
        <div>
            <Navbar />
            <div className="appointments-header" style={styles.header}>
                <div style={styles.overlay}></div>
                <div className="container" style={styles.container}>
                    <h1 style={styles.title}>Schedule Your Eye Check-Up</h1>
                </div>
            </div>

            <div className="container appointments-content" style={styles.contentContainer}>
                <form onSubmit={handleSubmit} className="appointments-form" style={styles.form}>
                    <h2 style={styles.formTitle}>Book Appointment</h2>

                    {/* Show selected service banner when coming from Services page */}
                    {formData.service && (() => {
                        const svc = services.find(s => String(s.service_id || s.id) === String(formData.service));
                        return svc ? (
                            <div style={styles.serviceBanner}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <span style={{ fontSize: '0.8rem', color: '#8B7355', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Selected Service</span>
                                        <p style={{ margin: '4px 0 0', fontWeight: '600', color: '#5D4E37', fontSize: '1.05rem' }}>{svc.name}</p>
                                    </div>
                                    <span style={{ fontWeight: '700', color: '#5D4E37', fontSize: '1.1rem' }}>₱{parseFloat(svc.price || 0).toFixed(2)}</span>
                                </div>
                            </div>
                        ) : null;
                    })()}

                    <div style={styles.formGroup}>
                        <label style={styles.label}>Full Name *</label>
                        <input
                            type="text"
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleChange}
                            style={styles.input}
                            required
                        />
                    </div>

                    <div className="appointments-form-row" style={styles.row}>
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Email *</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                style={styles.input}
                                required
                            />
                        </div>
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Phone Number</label>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                style={styles.input}
                            />
                        </div>
                    </div>

                    <div className="appointments-form-row" style={styles.row}>
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Birthday</label>
                            <input
                                type="date"
                                name="birthday"
                                value={formData.birthday}
                                onChange={handleChange}
                                style={styles.input}
                            />
                        </div>
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Gender</label>
                            <select
                                name="gender"
                                value={formData.gender}
                                onChange={handleChange}
                                style={styles.input}
                            >
                                <option value="">Select Gender</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Occupation</label>
                            <input
                                type="text"
                                name="occupation"
                                value={formData.occupation}
                                onChange={handleChange}
                                style={styles.input}
                                placeholder="e.g., Teacher, Engineer..."
                            />
                        </div>
                    </div>

                    {/* Doctor Selection */}
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Select Doctor *</label>
                        <CustomSelect
                            name="doctor"
                            value={formData.doctor}
                            onChange={handleChange}
                            required
                            placeholder="Choose a doctor"
                            options={[
                                { value: '', label: 'Choose a doctor' },
                                ...doctors.map(doc => ({
                                    value: String(doc.doctor_id || doc.id),
                                    label: `${doc.full_name} — ${doc.specialization}`,
                                })),
                            ]}
                        />
                    </div>

                    {/* Schedule-Based Date Selection */}
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Available Dates *</label>

                        {!formData.doctor ? (
                            <div style={styles.slotsPlaceholder}>
                                <span style={styles.placeholderIcon}>👨‍⚕️</span>
                                <p style={styles.placeholderText}>Select a doctor to see their available dates</p>
                            </div>
                        ) : schedulesLoading ? (
                            <div style={styles.slotsPlaceholder}>
                                <div style={styles.spinner}></div>
                                <p style={styles.placeholderText}>Loading doctor's schedule...</p>
                            </div>
                        ) : doctorSchedules.filter(s => !fullyBookedDates.has(s.schedule_date)).length > 0 ? (
                            <div className="date-chips-grid" style={styles.dateChipsGrid}>
                                {doctorSchedules.filter(s => !fullyBookedDates.has(s.schedule_date)).map(sch => (
                                    <button
                                        key={sch.docsched_id}
                                        type="button"
                                        onClick={() => selectScheduleDate(sch.schedule_date)}
                                        style={{
                                            ...styles.dateChip,
                                            ...(formData.date === sch.schedule_date ? styles.dateChipSelected : {}),
                                        }}
                                    >
                                        <span style={styles.dateChipDay}>{formatScheduleDate(sch.schedule_date)}</span>
                                        <span style={{
                                            ...styles.dateChipTime,
                                            color: formData.date === sch.schedule_date ? 'rgba(255,255,255,0.8)' : '#999',
                                        }}>
                                            {formatTime12h(sch.start_time)} – {formatTime12h(sch.end_time)}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        ) : doctorSchedules.length > 0 ? (
                            <div style={styles.noSlotsMessage}>
                                <span style={{ fontSize: '1.5rem' }}>📅</span>
                                <p>All dates for this doctor are fully booked.</p>
                                <small>Please try a different doctor.</small>
                            </div>
                        ) : (
                            <div style={styles.noSlotsMessage}>
                                <span style={{ fontSize: '1.5rem' }}>📅</span>
                                <p>No upcoming schedule for this doctor.</p>
                                <small>Please try a different doctor.</small>
                            </div>
                        )}
                    </div>

                    <div className="appointments-form-row" style={styles.row}>

                        {/* Service Type */}
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Service Type</label>
                            <CustomSelect
                                name="service"
                                value={formData.service}
                                onChange={handleChange}
                                placeholder="Select a service"
                                options={[
                                    { value: '', label: 'Select a service' },
                                    ...services.map(service => ({
                                        value: String(service.id || service.service_id),
                                        label: `${service.name} - ₱${parseFloat(service.price || 0).toFixed(2)}`,
                                    })),
                                ]}
                            />
                        </div>
                    </div>

                    {/* Hidden input to satisfy form required validation for date */}
                    <input type="hidden" name="date" value={formData.date} required />

                    {/* Time Slot Grid */}
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Available Time Slots *</label>

                        {!formData.doctor || !formData.date ? (
                            <div style={styles.slotsPlaceholder}>
                                <span style={styles.placeholderIcon}>📅</span>
                                <p style={styles.placeholderText}>
                                    Select a doctor and date to see available time slots
                                </p>
                            </div>
                        ) : slotsLoading ? (
                            <div style={styles.slotsPlaceholder}>
                                <div style={styles.spinner}></div>
                                <p style={styles.placeholderText}>Loading available slots...</p>
                            </div>
                        ) : slotsMessage ? (
                            <div style={styles.noSlotsMessage}>
                                <span style={{ fontSize: '1.5rem' }}>😔</span>
                                <p>{slotsMessage}</p>
                                <small>Try a different date or doctor.</small>
                            </div>
                        ) : (
                            <div className="slots-grid" style={styles.slotsGrid}>
                                {availableSlots.map((slot) => (
                                    <button
                                        key={slot.time}
                                        type="button"
                                        onClick={() => selectTimeSlot(slot.time)}
                                        style={{
                                            ...styles.slotButton,
                                            ...(formData.time === slot.time ? styles.slotButtonSelected : {}),
                                        }}
                                    >
                                        {slot.display}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Appointment Type */}
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Appointment Type</label>
                        <CustomSelect
                            name="type"
                            value={formData.type}
                            onChange={handleChange}
                            placeholder="Select type"
                            options={[
                                { value: 'In-Person', label: 'In-Person Visit' },
                                { value: 'Phone', label: 'Phone Consultation' },
                                { value: 'Video', label: 'Video Conference' },
                            ]}
                        />
                    </div>

                    <div style={styles.formGroup}>
                        <label style={styles.label}>Reason for Visit</label>
                        <textarea
                            name="reason"
                            value={formData.reason}
                            onChange={handleChange}
                            style={styles.textarea}
                            rows="4"
                        ></textarea>
                    </div>

                    <button type="submit" style={styles.submitBtn} disabled={!formData.time || loading}>
                        {loading ? 'Booking...' : 'Confirm Appointment'}
                    </button>
                </form>

                <div style={styles.sidebar}>
                    <div style={styles.guide}>
                        <h3 style={styles.sidebarTitle}>How it Works</h3>
                        <ol style={styles.list}>
                            <li>Select your preferred doctor.</li>
                            <li>Pick a date to see open time slots.</li>
                            <li>Choose an available slot and confirm.</li>
                            <li>Receive confirmation and visit the clinic.</li>
                        </ol>
                    </div>
                    <hr style={styles.divider} />
                    <div style={styles.policy}>
                        <h3 style={styles.sidebarTitle}>Appointment Policy</h3>
                        <p style={styles.text}>
                            Please arrive 10 minutes early. Cancellations must be made at least 24 hours in advance.
                        </p>
                    </div>

                    {/* Selected Doctor Card */}
                    {selectedDoctor && (
                        <>
                            <hr style={styles.divider} />
                            <div style={styles.doctorCard}>
                                <h3 style={styles.sidebarTitle}>Selected Doctor</h3>
                                {selectedDoctor.image && (
                                    <img
                                        src={selectedDoctor.image}
                                        alt={selectedDoctor.full_name}
                                        style={styles.doctorImage}
                                    />
                                )}
                                <p style={{ fontWeight: '600', color: '#5D4E37', margin: '8px 0 4px' }}>
                                    {selectedDoctor.full_name}
                                </p>
                                <p style={{ color: '#888', fontSize: '0.9rem', margin: 0 }}>
                                    {selectedDoctor.specialization}
                                </p>
                            </div>
                        </>
                    )}
                </div>
            </div>
            <Footer />

            {/* Confirmation Modal */}
            {showConfirmModal && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalContent}>
                        <h3 style={styles.modalTitle}>Confirm Appointment</h3>
                        <div style={styles.confirmDetails}>
                            <p><strong>Doctor:</strong> {selectedDoctor?.full_name}</p>
                            <p><strong>Date:</strong> {formData.date}</p>
                            <p><strong>Time:</strong> {availableSlots.find(s => s.time === formData.time)?.display || formData.time}</p>
                            <p><strong>Type:</strong> {formData.type}</p>
                        </div>
                        <p style={styles.modalText}>Are you sure you want to book this appointment?</p>
                        <div style={styles.modalActions}>
                            <button onClick={cancelAppointment} style={styles.cancelBtn} disabled={loading}>Cancel</button>
                            <button onClick={confirmAppointment} style={styles.okBtn} disabled={loading}>
                                {loading ? 'Booking...' : 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Success Modal */}
            {showSuccessModal && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalContent}>
                        <div style={{ fontSize: '3rem', marginBottom: '10px' }}>✅</div>
                        <h3 style={styles.modalTitle}>Appointment Booked!</h3>
                        <p style={styles.modalText}>
                            Your appointment has been successfully booked!
                            <br />
                            You can view your appointments in the "My Appointments" page.
                        </p>
                        <div style={styles.modalActions}>
                            <button onClick={() => setShowSuccessModal(false)} style={styles.cancelBtn}>Keep Browsing</button>
                            <button onClick={() => navigate('/client-my-appointments')} style={styles.okBtn}>My Appointments</button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                @keyframes slotPulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.04); }
                }

                @media (max-width: 768px) {
                    .appointments-content {
                        grid-template-columns: 1fr !important;
                        gap: 30px !important;
                        margin: 30px auto !important;
                        padding: 0 12px !important;
                    }
                    .appointments-header {
                        padding: 60px 0 !important;
                    }
                    .appointments-header h1 {
                        font-size: 1.8rem !important;
                    }
                    .appointments-form {
                        padding: 20px !important;
                    }
                    .appointments-form h2 {
                        font-size: 1.4rem !important;
                        margin-bottom: 20px !important;
                    }
                    .appointments-form-row {
                        flex-direction: column !important;
                        gap: 0 !important;
                    }
                    .date-chips-grid {
                        grid-template-columns: repeat(2, 1fr) !important;
                    }
                    .slots-grid {
                        grid-template-columns: repeat(2, 1fr) !important;
                    }
                }

                @media (max-width: 480px) {
                    .appointments-content {
                        padding: 0 8px !important;
                        margin: 20px auto !important;
                    }
                    .appointments-header {
                        padding: 40px 0 !important;
                    }
                    .appointments-header h1 {
                        font-size: 1.5rem !important;
                    }
                    .appointments-form {
                        padding: 15px !important;
                    }
                    .date-chips-grid {
                        grid-template-columns: 1fr !important;
                    }
                    .slots-grid {
                        grid-template-columns: repeat(2, 1fr) !important;
                    }
                }
            `}</style>
        </div>
    );
};

const styles = {
    header: {
        backgroundImage: `url(${checkUpBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        padding: '100px 0',
        textAlign: 'center',
        position: 'relative',
        color: 'white',
    },
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 1,
    },
    container: {
        maxWidth: 'var(--max-width)',
        margin: '0 auto',
        padding: '0 20px',
        position: 'relative',
        zIndex: 2,
    },
    title: {
        fontFamily: 'var(--font-heading-poppins)',
        fontSize: '3rem',
        color: 'var(--color-white)',
        textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
    },
    contentContainer: {
        maxWidth: 'var(--max-width)',
        margin: '60px auto',
        padding: '0 20px',
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: '60px',
    },
    form: {
        backgroundColor: 'var(--color-white)',
        padding: '40px',
        border: '1px solid #E0E0E0',
        borderRadius: 'var(--border-radius)',
    },
    formTitle: {
        fontFamily: 'var(--font-heading-montserrat)',
        fontSize: '1.8rem',
        color: 'var(--color-dark-brown)',
        marginBottom: '30px',
    },
    serviceBanner: {
        backgroundColor: '#F9F5F0',
        border: '1px solid #E8D5C0',
        borderRadius: '10px',
        padding: '14px 18px',
        marginBottom: '25px',
    },
    formGroup: {
        marginBottom: '20px',
        width: '100%',
    },
    row: {
        display: 'flex',
        gap: '20px',
    },
    label: {
        display: 'block',
        fontFamily: 'var(--font-body-inter)',
        fontWeight: '500',
        marginBottom: '8px',
        color: 'var(--color-text-secondary)',
    },
    hint: {
        display: 'block',
        fontSize: '0.8rem',
        color: '#999',
        marginTop: '4px',
        fontStyle: 'italic',
    },
    input: {
        width: '100%',
        padding: '12px',
        border: '1px solid #D7CCC8',
        borderRadius: 'var(--border-radius)',
        fontFamily: 'var(--font-body-inter)',
        fontSize: '1rem',
    },
    select: {
        width: '100%',
        padding: '12px',
        border: '1px solid #D7CCC8',
        borderRadius: 'var(--border-radius)',
        fontFamily: 'var(--font-body-inter)',
        fontSize: '1rem',
        backgroundColor: 'white',
    },
    textarea: {
        width: '100%',
        padding: '12px',
        border: '1px solid #D7CCC8',
        borderRadius: 'var(--border-radius)',
        fontFamily: 'var(--font-body-inter)',
        fontSize: '1rem',
        resize: 'vertical',
    },
    submitBtn: {
        backgroundColor: 'var(--color-dark-brown)',
        color: 'var(--color-white)',
        padding: '14px 32px',
        fontSize: '1rem',
        fontWeight: '600',
        width: '100%',
        marginTop: '10px',
        border: 'none',
        borderRadius: 'var(--border-radius)',
        cursor: 'pointer',
        opacity: 1,
        transition: 'opacity 0.2s',
    },

    // Time Slot Grid
    slotsPlaceholder: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
        border: '2px dashed #D7CCC8',
        borderRadius: '12px',
        backgroundColor: '#FAFAFA',
    },
    placeholderIcon: {
        fontSize: '2.5rem',
        marginBottom: '10px',
    },
    placeholderText: {
        fontFamily: 'var(--font-body-inter)',
        color: '#999',
        fontSize: '0.95rem',
        textAlign: 'center',
    },
    spinner: {
        width: '32px',
        height: '32px',
        border: '3px solid #E0E0E0',
        borderTop: '3px solid #5D4E37',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
        marginBottom: '12px',
    },
    noSlotsMessage: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '30px 20px',
        border: '1px solid #FFE0B2',
        borderRadius: '12px',
        backgroundColor: '#FFF8E1',
        textAlign: 'center',
        fontFamily: 'var(--font-body-inter)',
        color: '#F57C00',
    },
    slotsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(105px, 1fr))',
        gap: '10px',
    },
    slotButton: {
        padding: '12px 8px',
        border: '1.5px solid #D7CCC8',
        borderRadius: '8px',
        backgroundColor: '#FFF',
        cursor: 'pointer',
        fontFamily: 'var(--font-body-inter)',
        fontSize: '0.9rem',
        fontWeight: '500',
        color: '#5D4E37',
        transition: 'all 0.2s ease',
        textAlign: 'center',
    },
    slotButtonSelected: {
        backgroundColor: '#5D4E37',
        color: '#FFF',
        borderColor: '#5D4E37',
        fontWeight: '700',
        boxShadow: '0 2px 8px rgba(93, 78, 55, 0.3)',
        animation: 'slotPulse 0.3s ease',
    },

    // Date chips
    dateChipsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
        gap: '10px',
    },
    dateChip: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '14px 10px',
        border: '1.5px solid #D7CCC8',
        borderRadius: '10px',
        backgroundColor: '#FFF',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        textAlign: 'center',
    },
    dateChipSelected: {
        backgroundColor: '#5D4E37',
        color: '#FFF',
        borderColor: '#5D4E37',
        boxShadow: '0 3px 10px rgba(93, 78, 55, 0.3)',
    },
    dateChipDay: {
        fontFamily: 'var(--font-body-inter)',
        fontWeight: '600',
        fontSize: '0.95rem',
    },
    dateChipTime: {
        fontFamily: 'var(--font-body-inter)',
        fontSize: '0.75rem',
        marginTop: '4px',
    },

    // Sidebar
    sidebar: {
        paddingTop: '20px',
    },
    sidebarTitle: {
        fontFamily: 'var(--font-heading-montserrat)',
        fontSize: '1.2rem',
        color: 'var(--color-dark-brown)',
        marginBottom: '15px',
    },
    list: {
        paddingLeft: '20px',
        fontFamily: 'var(--font-body-inter)',
        color: 'var(--color-text-secondary)',
        lineHeight: '1.8',
    },
    divider: {
        border: 'none',
        borderTop: '1px solid #D7CCC8',
        margin: '30px 0',
    },
    text: {
        fontFamily: 'var(--font-body-inter)',
        color: 'var(--color-text-secondary)',
        lineHeight: '1.6',
    },
    policy: {},
    guide: {},
    doctorCard: {
        textAlign: 'center',
    },
    doctorImage: {
        width: '80px',
        height: '80px',
        borderRadius: '50%',
        objectFit: 'cover',
        border: '3px solid #D7CCC8',
    },

    // Confirmation details
    confirmDetails: {
        textAlign: 'left',
        backgroundColor: '#F9F5F0',
        padding: '15px 20px',
        borderRadius: '8px',
        marginBottom: '15px',
        fontFamily: 'var(--font-body-inter)',
        fontSize: '0.95rem',
        color: '#5D4E37',
        lineHeight: '1.8',
    },

    // Modals
    modalOverlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    modalContent: {
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '10px',
        textAlign: 'center',
        maxWidth: '420px',
        width: '90%',
        boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
    },
    modalTitle: {
        fontFamily: 'var(--font-heading-montserrat)',
        fontSize: '1.5rem',
        color: 'var(--color-dark-brown)',
        marginBottom: '15px',
    },
    modalText: {
        fontFamily: 'var(--font-body-inter)',
        fontSize: '1rem',
        color: '#666',
        marginBottom: '25px',
    },
    modalActions: {
        display: 'flex',
        justifyContent: 'center',
        gap: '15px',
    },
    cancelBtn: {
        padding: '10px 20px',
        border: '1px solid #ccc',
        borderRadius: '5px',
        backgroundColor: 'white',
        cursor: 'pointer',
        fontFamily: 'var(--font-body-inter)',
    },
    okBtn: {
        padding: '10px 20px',
        border: 'none',
        borderRadius: '5px',
        backgroundColor: 'var(--color-dark-brown)',
        color: 'white',
        cursor: 'pointer',
        fontFamily: 'var(--font-body-inter)',
    },
};

export default Appointments;
