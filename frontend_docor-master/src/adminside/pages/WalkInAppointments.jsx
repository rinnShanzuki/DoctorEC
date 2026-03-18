import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { cachedGet, invalidateCache } from '../../services/apiCache';
import { useNotification } from '../hooks/useNotification';
import './AppointmentPage.css';

const WalkInAppointments = () => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [dateFilter, setDateFilter] = useState('');
    const [doctorFilter, setDoctorFilter] = useState('');

    // View Modal
    const [showViewModal, setShowViewModal] = useState(false);
    const [currentAppointment, setCurrentAppointment] = useState(null);

    // Create Modal
    const [showAddModal, setShowAddModal] = useState(false);
    const [formStep, setFormStep] = useState(1);
    const [services, setServices] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [schedules, setSchedules] = useState([]);
    const [loadingSchedules, setLoadingSchedules] = useState(false);

    // Time slots (matching client-side)
    const [availableSlots, setAvailableSlots] = useState([]);
    const [slotsLoading, setSlotsLoading] = useState(false);
    const [slotsMessage, setSlotsMessage] = useState('');

    // Patient Search (existing patients)
    const [allPatients, setAllPatients] = useState([]);
    const [patientSearch, setPatientSearch] = useState('');
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [isNewPatient, setIsNewPatient] = useState(false);

    // Track fully-booked dates so they can be visually disabled
    const [fullyBookedDates, setFullyBookedDates] = useState(new Set());

    const [patientForm, setPatientForm] = useState({
        first_name: '', last_name: '', middle_name: '',
        phone: '', email: '', birthdate: '', gender: '', address: '', occupation: ''
    });
    const [appointmentForm, setAppointmentForm] = useState({
        service_id: '', doctor_id: '', appointment_date: '', appointment_time: ''
    });

    const { showNotification, NotificationModal } = useNotification();
    const statusTabs = ['All', 'Pending', 'Approved', 'Completed', 'Cancelled'];

    useEffect(() => {
        fetchAppointments();
        fetchServicesAndDoctors();
    }, []);

    const fetchAppointments = async () => {
        try {
            const { data: response, fromCache } = await cachedGet('/appointments');
            const data = response.data.data || response.data || [];
            const walkIn = data.filter(a => !a.clientAccount);
            setAppointments(walkIn);
            if (fromCache) setLoading(false);
        } catch (error) {
            console.error('Error fetching appointments:', error);
            setAppointments([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchServicesAndDoctors = async () => {
        try {
            const [sRes, dRes] = await Promise.all([
                cachedGet('/services'),
                cachedGet('/doctors')
            ]);
            setServices(sRes.data.data?.data || sRes.data.data || []);
            setDoctors(dRes.data.data?.data || dRes.data.data || []);
        } catch (error) {
            console.error('Error fetching services/doctors:', error);
        }
    };

    const fetchPatients = async () => {
        try {
            const { data: response } = await cachedGet('/patients');
            const data = response.data?.data || response.data || [];
            setAllPatients(data);
        } catch (error) {
            console.error('Error fetching patients:', error);
            setAllPatients([]);
        }
    };

    // Filter patients list based on search
    const filteredPatients = patientSearch.length >= 2
        ? allPatients.filter(p => {
            const name = p.name || `${p.first_name || ''} ${p.last_name || ''}`;
            const search = patientSearch.toLowerCase();
            return name.toLowerCase().includes(search) ||
                (p.email && p.email.toLowerCase().includes(search)) ||
                (p.phone && p.phone.includes(patientSearch)) ||
                (p.patient_code && p.patient_code.toLowerCase().includes(search));
        })
        : [];

    // Fetch doctor schedules when doctor is selected
    const fetchDoctorSchedules = async (doctorId) => {
        if (!doctorId) { setSchedules([]); return; }
        try {
            setLoadingSchedules(true);
            setFullyBookedDates(new Set());
            const response = await adminAPI.getDoctorSchedules(doctorId);
            const allSchedules = response.data.data || response.data || [];
            const today = new Date().toISOString().split('T')[0];
            const available = allSchedules.filter(s =>
                s.schedule_date >= today && s.status === 'available'
            );
            available.sort((a, b) => a.schedule_date.localeCompare(b.schedule_date));
            setSchedules(available);

            // Check each date's availability in background
            for (const sch of available) {
                try {
                    const slotsRes = await adminAPI.getAvailableSlots(doctorId, sch.schedule_date);
                    const slotsData = slotsRes.data.data || {};
                    if (slotsData.fully_booked) {
                        setFullyBookedDates(prev => new Set([...prev, sch.schedule_date]));
                    }
                } catch (e) { /* ignore individual failures */ }
            }
        } catch (error) {
            console.error('Error fetching schedules:', error);
            setSchedules([]);
        } finally {
            setLoadingSchedules(false);
        }
    };

    // Fetch available time slots for a specific date
    const fetchAvailableSlots = async (doctorId, date) => {
        try {
            setSlotsLoading(true);
            setSlotsMessage('');
            setAvailableSlots([]);
            const response = await adminAPI.getAvailableSlots(doctorId, date);
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

    // Filter logic for appointments list
    const filteredAppointments = appointments.filter(app => {
        const patientName = app.patient?.name ||
            (app.clientAccount ? `${app.clientAccount.first_name} ${app.clientAccount.last_name}` : 'Walk-In');
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

    // Open create modal
    const handleOpenCreate = () => {
        setShowAddModal(true);
        setFormStep(1);
        setSelectedPatient(null);
        setIsNewPatient(false);
        setPatientSearch('');
        fetchPatients();
    };

    // Select existing patient → go to Step 2
    const handleSelectPatient = (patient) => {
        setSelectedPatient(patient);
        setPatientSearch('');
        setFormStep(2);
    };

    const handleNewPatient = () => {
        setIsNewPatient(true);
        setSelectedPatient(null);
    };

    const handleBackToSearch = () => {
        setIsNewPatient(false);
        setPatientForm({ first_name: '', last_name: '', middle_name: '', phone: '', email: '', birthdate: '', gender: '', address: '', occupation: '' });
    };

    const handlePatientSubmit = (e) => {
        e.preventDefault();
        setFormStep(2);
    };

    // Doctor changed → fetch schedules, reset date/time/slots
    const handleDoctorChange = (doctorId) => {
        setAppointmentForm({ ...appointmentForm, doctor_id: doctorId, appointment_date: '', appointment_time: '' });
        setAvailableSlots([]);
        setSlotsMessage('');
        fetchDoctorSchedules(doctorId);
    };

    // Date chip selected → fetch available time slots
    const handleDateSelect = (date) => {
        setAppointmentForm({ ...appointmentForm, appointment_date: date, appointment_time: '' });
        fetchAvailableSlots(appointmentForm.doctor_id, date);
    };

    // Time slot selected
    const handleTimeSelect = (time) => {
        setAppointmentForm({ ...appointmentForm, appointment_time: time });
    };

    // Final submit
    const handleAppointmentSubmit = async (e) => {
        e.preventDefault();
        try {
            let patientId;
            if (selectedPatient) {
                patientId = selectedPatient.id || selectedPatient.patient_id;
            } else {
                const patientRes = await adminAPI.createPatient(patientForm);
                patientId = patientRes.data.data?.patient_id || patientRes.data.patient_id;
            }

            await adminAPI.createAppointment({
                ...appointmentForm,
                appointment_type: 'in-person',
                patient_id: patientId,
                occupation: patientForm.occupation || (selectedPatient ? selectedPatient.occupation : null) || null,
                status: 'approved'
            });
            showNotification('Walk-in appointment created successfully!', 'success');
            resetAndClose();
            fetchAppointments();
        } catch (error) {
            showNotification('Failed to create appointment: ' + (error.response?.data?.message || error.message), 'error');
        }
    };

    const resetAndClose = () => {
        setShowAddModal(false);
        setFormStep(1);
        setSelectedPatient(null);
        setIsNewPatient(false);
        setPatientSearch('');
        setPatientForm({ first_name: '', last_name: '', middle_name: '', phone: '', email: '', birthdate: '', gender: '', address: '', occupation: '' });
        setAppointmentForm({ service_id: '', doctor_id: '', appointment_date: '', appointment_time: '' });
        setSchedules([]);
        setAvailableSlots([]);
        setSlotsMessage('');
        setFullyBookedDates(new Set());
    };

    const getStatusClass = (status) => {
        const map = { Pending: 'ap-status-pending', Approved: 'ap-status-confirmed', Completed: 'ap-status-completed', Cancelled: 'ap-status-cancelled' };
        return map[status] || 'ap-status-pending';
    };

    const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    const formatScheduleDate = (dateStr) => {
        const date = new Date(dateStr + 'T00:00:00');
        return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    };
    const formatTime = (t) => {
        if (!t) return '';
        const [h, m] = t.split(':');
        const hr = parseInt(h);
        const ampm = hr >= 12 ? 'PM' : 'AM';
        const h12 = hr % 12 || 12;
        return `${h12}:${m} ${ampm}`;
    };

    if (loading) return <div className="ap-loading"><div className="ap-spinner"></div><p>Loading appointments...</p></div>;

    return (
        <div className="ap-page">
            <div className="ap-header">
                <div>
                    <h1>Walk-In Appointments</h1>
                    <p className="ap-subtitle">Manage walk-in patient appointments</p>
                </div>
                <button className="ap-btn ap-btn-primary" onClick={handleOpenCreate}>
                    + Create Appointment
                </button>
            </div>

            {/* Filters Row */}
            <div className="ap-filters">
                <input type="text" className="ap-search"
                    placeholder="Search by patient, service, or doctor..."
                    value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                <input type="date" className="ap-filter-input"
                    value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
                <select className="ap-filter-input" value={doctorFilter}
                    onChange={(e) => setDoctorFilter(e.target.value)}>
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
                    <button key={tab}
                        className={`ap-tab ${statusFilter === tab ? 'ap-tab-active' : ''}`}
                        onClick={() => setStatusFilter(tab)}>
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
                                <th>ID</th><th>Patient</th><th>Service</th><th>Doctor</th>
                                <th>Date & Time</th><th>Status</th><th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAppointments.length > 0 ? (
                                filteredAppointments.map(app => {
                                    const patientName = app.patient?.name ||
                                        (app.clientAccount ? `${app.clientAccount.first_name} ${app.clientAccount.last_name}` : 'Walk-In');
                                    return (
                                        <tr key={app.appointment_id}>
                                            <td className="ap-id">#{app.appointment_id}</td>
                                            <td>{patientName}</td>
                                            <td>{app.service?.name || 'N/A'}</td>
                                            <td>{app.doctor?.full_name || 'Unassigned'}</td>
                                            <td>
                                                <span className="ap-date">{formatDate(app.appointment_date)}</span>
                                                <span className="ap-time">{formatTime(app.appointment_time)}</span>
                                            </td>
                                            <td><span className={`ap-status-badge ${getStatusClass(app.status)}`}>{app.status}</span></td>
                                            <td><button className="ap-btn ap-btn-sm" onClick={() => handleView(app)}>View</button></td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr><td colSpan="7" className="ap-no-data">No appointments found</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ========== CREATE APPOINTMENT MODAL ========== */}
            {showAddModal && (
                <div className="ap-modal-overlay" onClick={() => resetAndClose()}>
                    <div className="ap-modal" onClick={e => e.stopPropagation()}>
                        <div className="ap-modal-header">
                            <h3>Create Walk-In Appointment</h3>
                            <span className="ap-step-indicator">Step {formStep} of 2</span>
                        </div>

                        {/* ===== STEP 1: Patient Selection ===== */}
                        {formStep === 1 && !isNewPatient && (
                            <div>
                                <h4 className="ap-section-title">Select Patient</h4>
                                <div className="ap-patient-search-box">
                                    <input type="text" className="ap-search"
                                        placeholder="Search existing patient by name, email, phone, or code..."
                                        value={patientSearch}
                                        onChange={(e) => setPatientSearch(e.target.value)}
                                        autoFocus />
                                </div>

                                {patientSearch.length >= 2 && (
                                    <div className="ap-patient-results">
                                        {filteredPatients.length > 0 ? (
                                            filteredPatients.slice(0, 8).map(patient => (
                                                <div key={patient.id || patient.patient_id}
                                                    className="ap-patient-result-item"
                                                    onClick={() => handleSelectPatient(patient)}>
                                                    <div className="ap-patient-result-info">
                                                        <strong>{patient.name || `${patient.first_name} ${patient.last_name}`}</strong>
                                                        <small>
                                                            {patient.patient_code && <span className="ap-patient-code">{patient.patient_code}</span>}
                                                            {patient.phone && patient.phone !== 'N/A' && <span> · {patient.phone}</span>}
                                                            {patient.email && patient.email !== 'N/A' && <span> · {patient.email}</span>}
                                                        </small>
                                                    </div>
                                                    <span className="ap-select-arrow">Select →</span>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="ap-patient-no-results">
                                                <p>No existing patient found for "{patientSearch}"</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="ap-patient-divider"><span>or</span></div>
                                <button className="ap-btn ap-btn-primary ap-btn-full" onClick={handleNewPatient}>
                                    + Register New Patient
                                </button>
                                <div className="ap-modal-footer">
                                    <button type="button" className="ap-btn ap-btn-secondary" onClick={resetAndClose}>Cancel</button>
                                </div>
                            </div>
                        )}

                        {/* ===== STEP 1B: New Patient Form ===== */}
                        {formStep === 1 && isNewPatient && (
                            <form onSubmit={handlePatientSubmit}>
                                <h4 className="ap-section-title">New Patient Information</h4>
                                <div className="ap-form-grid">
                                    <div className="ap-form-group">
                                        <label>First Name *</label>
                                        <input type="text" required value={patientForm.first_name}
                                            onChange={e => setPatientForm({ ...patientForm, first_name: e.target.value })} />
                                    </div>
                                    <div className="ap-form-group">
                                        <label>Last Name *</label>
                                        <input type="text" required value={patientForm.last_name}
                                            onChange={e => setPatientForm({ ...patientForm, last_name: e.target.value })} />
                                    </div>
                                    <div className="ap-form-group">
                                        <label>Middle Name</label>
                                        <input type="text" value={patientForm.middle_name}
                                            onChange={e => setPatientForm({ ...patientForm, middle_name: e.target.value })} />
                                    </div>
                                    <div className="ap-form-group">
                                        <label>Phone</label>
                                        <input type="tel" value={patientForm.phone}
                                            onChange={e => setPatientForm({ ...patientForm, phone: e.target.value })} />
                                    </div>
                                    <div className="ap-form-group">
                                        <label>Email</label>
                                        <input type="email" value={patientForm.email}
                                            onChange={e => setPatientForm({ ...patientForm, email: e.target.value })} />
                                    </div>
                                    <div className="ap-form-group">
                                        <label>Birthdate</label>
                                        <input type="date" value={patientForm.birthdate}
                                            onChange={e => setPatientForm({ ...patientForm, birthdate: e.target.value })} />
                                    </div>
                                    <div className="ap-form-group">
                                        <label>Gender</label>
                                        <select value={patientForm.gender}
                                            onChange={e => setPatientForm({ ...patientForm, gender: e.target.value })}>
                                            <option value="">Select Gender</option>
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                    <div className="ap-form-group ap-full-width">
                                        <label>Address</label>
                                        <textarea value={patientForm.address}
                                            onChange={e => setPatientForm({ ...patientForm, address: e.target.value })}
                                            rows="2" />
                                    </div>
                                    <div className="ap-form-group">
                                        <label>Occupation</label>
                                        <input type="text" value={patientForm.occupation}
                                            placeholder="e.g., Teacher, Engineer..."
                                            onChange={e => setPatientForm({ ...patientForm, occupation: e.target.value })} />
                                    </div>
                                </div>
                                <div className="ap-modal-footer">
                                    <button type="button" className="ap-btn ap-btn-secondary" onClick={handleBackToSearch}>← Back to Search</button>
                                    <button type="submit" className="ap-btn ap-btn-primary">Next: Appointment Details →</button>
                                </div>
                            </form>
                        )}

                        {/* ===== STEP 2: Appointment Details with Date Chips + Time Slots ===== */}
                        {formStep === 2 && (
                            <form onSubmit={handleAppointmentSubmit}>
                                {/* Selected patient banner */}
                                {selectedPatient && (
                                    <div className="ap-selected-patient-banner">
                                        <div>
                                            <strong>Patient:</strong> {selectedPatient.name || `${selectedPatient.first_name} ${selectedPatient.last_name}`}
                                            {selectedPatient.patient_code && <span className="ap-patient-code" style={{ marginLeft: 8 }}>{selectedPatient.patient_code}</span>}
                                        </div>
                                        <button type="button" className="ap-btn ap-btn-ghost ap-btn-xs"
                                            onClick={() => { setSelectedPatient(null); setFormStep(1); setIsNewPatient(false); }}>
                                            Change Patient
                                        </button>
                                    </div>
                                )}
                                {!selectedPatient && (
                                    <div className="ap-selected-patient-banner ap-new-patient-banner">
                                        <div>
                                            <strong>New Patient:</strong> {patientForm.first_name} {patientForm.last_name}
                                        </div>
                                        <button type="button" className="ap-btn ap-btn-ghost ap-btn-xs"
                                            onClick={() => { setFormStep(1); setIsNewPatient(true); }}>
                                            Edit Patient
                                        </button>
                                    </div>
                                )}

                                <h4 className="ap-section-title">Appointment Details</h4>

                                {/* Service */}
                                <div className="ap-form-grid">
                                    <div className="ap-form-group">
                                        <label>Service *</label>
                                        <select required value={appointmentForm.service_id}
                                            onChange={e => setAppointmentForm({ ...appointmentForm, service_id: e.target.value })}>
                                            <option value="">Select Service</option>
                                            {services.map(s => (
                                                <option key={s.service_id} value={s.service_id}>
                                                    {s.name} - ₱{Number(s.price).toLocaleString()}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Doctor */}
                                    <div className="ap-form-group">
                                        <label>Doctor *</label>
                                        <select required value={appointmentForm.doctor_id}
                                            onChange={e => handleDoctorChange(e.target.value)}>
                                            <option value="">Select Doctor</option>
                                            {doctors.map(d => (
                                                <option key={d.doctor_id} value={d.doctor_id}>{d.full_name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Available Dates — date chip buttons (matching client-side) */}
                                {appointmentForm.doctor_id && (
                                    <div className="ap-schedule-section">
                                        <label className="ap-schedule-label">Available Dates</label>
                                        {loadingSchedules ? (
                                            <p className="ap-schedule-loading">Loading doctor's schedule...</p>
                                        ) : schedules.filter(s => !fullyBookedDates.has(s.schedule_date)).length > 0 ? (
                                            <div className="ap-date-chips">
                                                {schedules.filter(s => !fullyBookedDates.has(s.schedule_date)).map(sch => (
                                                    <button
                                                        key={sch.docsched_id}
                                                        type="button"
                                                        className={`ap-date-chip ${appointmentForm.appointment_date === sch.schedule_date ? 'ap-date-chip-active' : ''}`}
                                                        onClick={() => handleDateSelect(sch.schedule_date)}
                                                    >
                                                        <span className="ap-date-chip-day">{formatScheduleDate(sch.schedule_date)}</span>
                                                        <span className="ap-date-chip-time">{formatTime(sch.start_time)} – {formatTime(sch.end_time)}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        ) : schedules.length > 0 ? (
                                            <p className="ap-no-schedule">All dates for this doctor are fully booked</p>
                                        ) : (
                                            <p className="ap-no-schedule">No upcoming schedules for this doctor</p>
                                        )}
                                    </div>
                                )}

                                {/* Available Time Slots — individual 30-min slot buttons (matching client-side) */}
                                {appointmentForm.doctor_id && appointmentForm.appointment_date && (
                                    <div className="ap-schedule-section">
                                        <label className="ap-schedule-label">Available Time Slots</label>
                                        {slotsLoading ? (
                                            <p className="ap-schedule-loading">Loading available slots...</p>
                                        ) : slotsMessage ? (
                                            <p className="ap-no-schedule">{slotsMessage}</p>
                                        ) : availableSlots.length > 0 ? (
                                            <div className="ap-slots-grid">
                                                {availableSlots.map(slot => (
                                                    <button
                                                        key={slot.time}
                                                        type="button"
                                                        className={`ap-slot-btn ${appointmentForm.appointment_time === slot.time ? 'ap-slot-btn-active' : ''}`}
                                                        onClick={() => handleTimeSelect(slot.time)}
                                                    >
                                                        {slot.display}
                                                    </button>
                                                ))}
                                            </div>
                                        ) : null}
                                    </div>
                                )}

                                <div className="ap-auto-confirm-banner">
                                    <p>✓ This walk-in appointment will be automatically <strong>confirmed</strong> upon creation.</p>
                                </div>

                                <div className="ap-modal-footer">
                                    <button type="button" className="ap-btn ap-btn-secondary"
                                        onClick={() => { setFormStep(1); if (!selectedPatient) setIsNewPatient(true); else { setSelectedPatient(null); setIsNewPatient(false); } }}>
                                        ← Back
                                    </button>
                                    <button type="submit" className="ap-btn ap-btn-success"
                                        disabled={!appointmentForm.appointment_time}>
                                        ✓ Create Appointment
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}

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
                                <label>Patient</label>
                                <span>
                                    {currentAppointment.patient?.name ||
                                        (currentAppointment.clientAccount
                                            ? `${currentAppointment.clientAccount.first_name} ${currentAppointment.clientAccount.last_name}`
                                            : 'Walk-In')}
                                </span>
                                {(currentAppointment.patient?.email || currentAppointment.clientAccount?.email) && (
                                    <small>{currentAppointment.patient?.email || currentAppointment.clientAccount?.email}</small>
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
                        </div>

                        {currentAppointment.notes && (
                            <div className="ap-notes-section">
                                <label>Notes</label>
                                <p>{currentAppointment.notes}</p>
                            </div>
                        )}

                        <div className="ap-modal-actions">
                            {currentAppointment.status?.toLowerCase() === 'pending' && (
                                <>
                                    <button className="ap-btn ap-btn-success" onClick={() => handleStatusUpdate('Approved')}>✓ Approve</button>
                                    <button className="ap-btn ap-btn-danger" onClick={() => handleStatusUpdate('Cancelled')}>✕ Cancel</button>
                                </>
                            )}
                            {currentAppointment.status?.toLowerCase() === 'approved' && (
                                <>
                                    <button className="ap-btn ap-btn-primary" onClick={() => handleStatusUpdate('Completed')}>✓ Mark Completed</button>
                                    <button className="ap-btn ap-btn-danger" onClick={() => handleStatusUpdate('Cancelled')}>✕ Cancel</button>
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

export default WalkInAppointments;
