import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import { useNotification } from '../hooks/useNotification';
import './Dashboard.css';

const AdminAppointments = () => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [showViewModal, setShowViewModal] = useState(false);
    const [currentAppointment, setCurrentAppointment] = useState(null);
    const navigate = useNavigate();

    // Add Appointment Modal States
    const [showAddModal, setShowAddModal] = useState(false);
    const [formStep, setFormStep] = useState(1);
    const [services, setServices] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [patientForm, setPatientForm] = useState({
        first_name: '',
        last_name: '',
        middle_name: '',
        phone: '',
        email: '',
        birthdate: '',
        gender: '',
        address: ''
    });
    const [appointmentForm, setAppointmentForm] = useState({
        appointment_type: 'in-person',
        service_id: '',
        appointment_date: '',
        appointment_time: '',
        doctor_id: '',
        notes: ''
    });
    const { showNotification, NotificationModal } = useNotification();

    // Fetch Appointments
    useEffect(() => {
        fetchAppointments();
        fetchServicesAndDoctors();
    }, []);

    const fetchAppointments = async () => {
        try {
            setLoading(true);
            const response = await adminAPI.getAppointments();
            const appointmentsData = response.data.data || response.data || [];
            setAppointments(appointmentsData);
        } catch (error) {
            console.error('Error fetching appointments:', error);
            setAppointments([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchServicesAndDoctors = async () => {
        try {
            const [servicesRes, doctorsRes] = await Promise.all([
                adminAPI.getServices(),
                adminAPI.getDoctors()
            ]);
            setServices(servicesRes.data.data || servicesRes.data || []);
            setDoctors(doctorsRes.data.data || doctorsRes.data || []);
        } catch (error) {
            console.error('Error fetching services/doctors:', error);
        }
    };

    // Filter Logic
    const filteredAppointments = appointments.filter(app => {
        const patientName = app.patient?.name ||
            (app.clientAccount ? `${app.clientAccount.first_name} ${app.clientAccount.last_name}` : 'Unknown Patient');
        const serviceName = app.service?.name || 'Unknown Service';
        const doctorName = app.doctor?.full_name || 'Unassigned';
        const searchString = searchTerm.toLowerCase();

        const matchesSearch = patientName.toLowerCase().includes(searchString) ||
            serviceName.toLowerCase().includes(searchString) ||
            doctorName.toLowerCase().includes(searchString) ||
            app.appointment_id?.toString().includes(searchTerm);

        const matchesStatus = statusFilter === 'All' || app.status?.toLowerCase() === statusFilter.toLowerCase();

        return matchesSearch && matchesStatus;
    });

    // Handle View
    const handleView = (appointment) => {
        setCurrentAppointment({ ...appointment });
        setShowViewModal(true);
    };

    // Handle Add Appointment
    const handleAddAppointment = () => {
        setShowAddModal(true);
        setFormStep(1);
    };

    // Handle Patient Form Submit (Step 1)
    const handlePatientSubmit = async (e) => {
        e.preventDefault();
        setFormStep(2);
    };

    // Handle Appointment Form Submit (Step 2)
    const handleAppointmentSubmit = async (e) => {
        e.preventDefault();
        try {
            // Step 1: Create Patient
            const patientRes = await adminAPI.createPatient(patientForm);
            const patientId = patientRes.data.data?.patient_id || patientRes.data.patient_id;

            // Step 2: Create Appointment with status 'Approved'
            const appointmentData = {
                ...appointmentForm,
                patient_id: patientId,
                status: 'approved'
            };

            await adminAPI.createAppointment(appointmentData);

            showNotification('Appointment created and approved successfully!', 'success');
            setShowAddModal(false);
            setFormStep(1);
            // Reset forms
            setPatientForm({
                first_name: '',
                last_name: '',
                middle_name: '',
                phone: '',
                email: '',
                birthdate: '',
                gender: '',
                address: ''
            });
            setAppointmentForm({
                appointment_type: 'in-person',
                service_id: '',
                appointment_date: '',
                appointment_time: '',
                doctor_id: '',
                notes: ''
            });
            fetchAppointments();
        } catch (error) {
            console.error('Error creating appointment:', error);
            showNotification('Failed to create appointment: ' + (error.response?.data?.message || error.message), 'error');
        }
    };

    // Handle Approve
    const handleApprove = async () => {
        try {
            await adminAPI.updateAppointmentStatus(currentAppointment.appointment_id, 'Approved');
            setAppointments(appointments.map(app =>
                app.appointment_id === currentAppointment.appointment_id ? { ...app, status: 'Approved' } : app
            ));
            showNotification('Appointment approved successfully!', 'success');
            setShowViewModal(false);
            fetchAppointments();
        } catch (error) {
            console.error('Error approving appointment:', error);
            showNotification('Failed to approve appointment: ' + (error.response?.data?.message || error.message), 'error');
        }
    };

    // Handle Cancel
    const handleCancel = async () => {
        try {
            await adminAPI.updateAppointmentStatus(currentAppointment.appointment_id, 'Cancelled');
            setAppointments(appointments.map(app =>
                app.appointment_id === currentAppointment.appointment_id ? { ...app, status: 'Cancelled' } : app
            ));
            showNotification('Appointment cancelled successfully!', 'success');
            setShowViewModal(false);
            fetchAppointments();
        } catch (error) {
            console.error('Error cancelling appointment:', error);
            showNotification('Failed to cancel appointment: ' + (error.response?.data?.message || error.message), 'error');
        }
    };

    // Handle Mark as Ongoing
    const handleMarkOngoing = async () => {
        try {
            await adminAPI.updateAppointmentStatus(currentAppointment.appointment_id, 'Ongoing');
            setAppointments(appointments.map(app =>
                app.appointment_id === currentAppointment.appointment_id ? { ...app, status: 'Ongoing' } : app
            ));
            showNotification('Appointment marked as ongoing!', 'success');
            setShowViewModal(false);
            fetchAppointments();
        } catch (error) {
            console.error('Error updating appointment:', error);
            showNotification('Failed to update appointment: ' + (error.response?.data?.message || error.message), 'error');
        }
    };

    // Handle Mark as Completed
    const handleMarkCompleted = async () => {
        try {
            await adminAPI.updateAppointmentStatus(currentAppointment.appointment_id, 'Completed');
            setAppointments(appointments.map(app =>
                app.appointment_id === currentAppointment.appointment_id ? { ...app, status: 'Completed' } : app
            ));
            showNotification('Appointment marked as completed!', 'success');
            setShowViewModal(false);
            fetchAppointments();
        } catch (error) {
            console.error('Error completing appointment:', error);
            showNotification('Failed to complete appointment: ' + (error.response?.data?.message || error.message), 'error');
        }
    };

    // Get status badge class
    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'Completed': return 'status-completed';
            case 'Cancelled': return 'status-cancelled';
            case 'Approved': return 'status-confirmed';
            case 'Ongoing': return 'status-pending';
            case 'Pending': return 'status-pending';
            default: return 'status-pending';
        }
    };

    if (loading) return <div className="dashboard-loading"><div className="spinner"></div></div>;

    return (
        <div className="dashboard">
            <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1>Appointments</h1>
                    <p className="dashboard-subtitle">Manage patient appointments</p>
                </div>
                <button
                    onClick={handleAddAppointment}
                    style={{
                        padding: '12px 24px',
                        backgroundColor: '#5D4E37',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '600',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }}
                >
                    + Add Appointment
                </button>
            </div>

            {/* Status Tabs */}
            <div style={{
                marginBottom: '24px',
                display: 'flex',
                gap: '10px',
                borderBottom: '2px solid #E0D5C7',
                paddingBottom: '10px'
            }}>
                {['All', 'Pending', 'Approved', 'Ongoing', 'Completed', 'Cancelled'].map(status => (
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
                    placeholder="Search by patient, service, or doctor..."
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

            {/* Appointments Table */}
            <div className="chart-container">
                <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Patient</th>
                                <th>Service</th>
                                <th>Doctor</th>
                                <th>Date & Time</th>
                                <th>Type</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAppointments.length > 0 ? (
                                filteredAppointments.map(app => {
                                    const patientName = app.patient?.name ||
                                        (app.clientAccount ? `${app.clientAccount.first_name} ${app.clientAccount.last_name}` : 'Unknown');
                                    const serviceName = app.service?.name || 'N/A';
                                    const doctorName = app.doctor?.full_name || 'Unassigned';

                                    return (
                                        <tr key={app.appointment_id}>
                                            <td>#{app.appointment_id}</td>
                                            <td>{patientName}</td>
                                            <td>{serviceName}</td>
                                            <td>{doctorName}</td>
                                            <td>
                                                {new Date(app.appointment_date).toLocaleDateString()}<br />
                                                <span style={{ fontSize: '12px', color: '#666' }}>{app.appointment_time}</span>
                                            </td>
                                            <td style={{ textTransform: 'capitalize' }}>{app.appointment_type}</td>
                                            <td>
                                                <span className={`status-badge ${getStatusBadgeClass(app.status)}`}>
                                                    {app.status}
                                                </span>
                                            </td>
                                            <td>
                                                <button
                                                    onClick={() => handleView(app)}
                                                    style={{
                                                        padding: '6px 16px',
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
                                                {app.status === 'Completed' && (
                                                    <button
                                                        onClick={() => {
                                                            const customerName = app.patient?.name ||
                                                                (app.clientAccount ? `${app.clientAccount.first_name} ${app.clientAccount.last_name}`.trim() : 'Walk-in');
                                                            const serviceName = app.service?.name || '';
                                                            const params = new URLSearchParams({
                                                                appointment_id: app.appointment_id,
                                                                customer: customerName,
                                                                service: serviceName
                                                            });
                                                            if (app.prescription?.product_required) {
                                                                params.set('product_required', '1');
                                                            }
                                                            navigate(`/cashier?${params.toString()}`);
                                                        }}
                                                        style={{
                                                            padding: '6px 16px',
                                                            fontSize: '12px',
                                                            backgroundColor: app.prescription?.product_required ? '#E65100' : '#34A853',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '4px',
                                                            cursor: 'pointer',
                                                            fontWeight: '600',
                                                            marginLeft: '6px'
                                                        }}
                                                        title={app.prescription?.product_required ? 'Payment — Products Prescribed!' : 'Proceed to Payment'}
                                                    >
                                                        {app.prescription?.product_required ? '⚠️ 💳 Payment' : '💳 Payment'}
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="8" className="no-data">No appointments found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Appointment Modal */}
            {showAddModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '700px', textAlign: 'left' }}>
                        <h3 style={{ marginBottom: '20px', borderBottom: '2px solid #E0D5C7', paddingBottom: '10px' }}>
                            Add New Appointment - Step {formStep} of 2
                        </h3>

                        {/* Step 1: Patient Information */}
                        {formStep === 1 && (
                            <form onSubmit={handlePatientSubmit}>
                                <h4 style={{ color: '#5D4E37', marginBottom: '15px' }}>Patient Information</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>First Name *</label>
                                        <input
                                            type="text"
                                            required
                                            value={patientForm.first_name}
                                            onChange={(e) => setPatientForm({ ...patientForm, first_name: e.target.value })}
                                            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #E0D5C7' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Last Name *</label>
                                        <input
                                            type="text"
                                            required
                                            value={patientForm.last_name}
                                            onChange={(e) => setPatientForm({ ...patientForm, last_name: e.target.value })}
                                            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #E0D5C7' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Middle Name</label>
                                        <input
                                            type="text"
                                            value={patientForm.middle_name}
                                            onChange={(e) => setPatientForm({ ...patientForm, middle_name: e.target.value })}
                                            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #E0D5C7' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Phone</label>
                                        <input
                                            type="tel"
                                            value={patientForm.phone}
                                            onChange={(e) => setPatientForm({ ...patientForm, phone: e.target.value })}
                                            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #E0D5C7' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Email</label>
                                        <input
                                            type="email"
                                            value={patientForm.email}
                                            onChange={(e) => setPatientForm({ ...patientForm, email: e.target.value })}
                                            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #E0D5C7' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Birthdate</label>
                                        <input
                                            type="date"
                                            value={patientForm.birthdate}
                                            onChange={(e) => setPatientForm({ ...patientForm, birthdate: e.target.value })}
                                            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #E0D5C7' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Gender</label>
                                        <select
                                            value={patientForm.gender}
                                            onChange={(e) => setPatientForm({ ...patientForm, gender: e.target.value })}
                                            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #E0D5C7' }}
                                        >
                                            <option value="">Select Gender</option>
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                    <div style={{ gridColumn: '1 / -1' }}>
                                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Address</label>
                                        <textarea
                                            value={patientForm.address}
                                            onChange={(e) => setPatientForm({ ...patientForm, address: e.target.value })}
                                            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #E0D5C7', minHeight: '60px' }}
                                        />
                                    </div>
                                </div>
                                <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                    <button
                                        type="button"
                                        onClick={() => setShowAddModal(false)}
                                        style={{
                                            padding: '10px 20px',
                                            backgroundColor: '#666',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '6px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        style={{
                                            padding: '10px 20px',
                                            backgroundColor: '#5D4E37',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            fontWeight: '600'
                                        }}
                                    >
                                        Next: Appointment Details →
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* Step 2: Appointment Information */}
                        {formStep === 2 && (
                            <form onSubmit={handleAppointmentSubmit}>
                                <h4 style={{ color: '#5D4E37', marginBottom: '15px' }}>Appointment Details</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Service *</label>
                                        <select
                                            required
                                            value={appointmentForm.service_id}
                                            onChange={(e) => setAppointmentForm({ ...appointmentForm, service_id: e.target.value })}
                                            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #E0D5C7' }}
                                        >
                                            <option value="">Select Service</option>
                                            {services.map(service => (
                                                <option key={service.service_id} value={service.service_id}>
                                                    {service.name} - ₱{service.price}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Doctor *</label>
                                        <select
                                            required
                                            value={appointmentForm.doctor_id}
                                            onChange={(e) => setAppointmentForm({ ...appointmentForm, doctor_id: e.target.value })}
                                            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #E0D5C7' }}
                                        >
                                            <option value="">Select Doctor</option>
                                            {doctors.map(doctor => (
                                                <option key={doctor.doctor_id} value={doctor.doctor_id}>
                                                    {doctor.full_name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Appointment Type *</label>
                                        <select
                                            required
                                            value={appointmentForm.appointment_type}
                                            onChange={(e) => setAppointmentForm({ ...appointmentForm, appointment_type: e.target.value })}
                                            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #E0D5C7' }}
                                        >
                                            <option value="in-person">In-Person</option>
                                            <option value="online">Online</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Date *</label>
                                        <input
                                            type="date"
                                            required
                                            value={appointmentForm.appointment_date}
                                            onChange={(e) => setAppointmentForm({ ...appointmentForm, appointment_date: e.target.value })}
                                            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #E0D5C7' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Time *</label>
                                        <input
                                            type="time"
                                            required
                                            value={appointmentForm.appointment_time}
                                            onChange={(e) => setAppointmentForm({ ...appointmentForm, appointment_time: e.target.value })}
                                            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #E0D5C7' }}
                                        />
                                    </div>
                                    <div style={{ gridColumn: '1 / -1' }}>
                                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Notes</label>
                                        <textarea
                                            value={appointmentForm.notes}
                                            onChange={(e) => setAppointmentForm({ ...appointmentForm, notes: e.target.value })}
                                            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #E0D5C7', minHeight: '60px' }}
                                            placeholder="Additional notes or special instructions..."
                                        />
                                    </div>
                                </div>
                                <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#e8f5e9', borderRadius: '6px', marginBottom: '15px' }}>
                                    <p style={{ margin: 0, fontSize: '14px', color: '#2e7d32' }}>
                                        ✓ This appointment will be automatically <strong>approved</strong> upon creation.
                                    </p>
                                </div>
                                <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                    <button
                                        type="button"
                                        onClick={() => setFormStep(1)}
                                        style={{
                                            padding: '10px 20px',
                                            backgroundColor: '#666',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '6px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        ← Back
                                    </button>
                                    <button
                                        type="submit"
                                        style={{
                                            padding: '10px 20px',
                                            backgroundColor: '#4CAF50',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            fontWeight: '600'
                                        }}
                                    >
                                        ✓ Create Appointment
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {/* View/Manage Appointment Modal */}
            {showViewModal && currentAppointment && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '600px', textAlign: 'left' }}>
                        <h3 style={{ marginBottom: '20px', borderBottom: '2px solid #E0D5C7', paddingBottom: '10px' }}>
                            Appointment Details #{currentAppointment.appointment_id}
                        </h3>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                            {/* Patient Info */}
                            <div>
                                <strong style={{ display: 'block', marginBottom: '5px', color: '#5D4E37' }}>Patient:</strong>
                                <div>
                                    {currentAppointment.patient?.name ||
                                        (currentAppointment.clientAccount
                                            ? `${currentAppointment.clientAccount.first_name} ${currentAppointment.clientAccount.last_name}`
                                            : 'Unknown')}
                                </div>
                                {currentAppointment.patient && (
                                    <>
                                        {currentAppointment.patient.email && (
                                            <div style={{ fontSize: '12px', color: '#666' }}>{currentAppointment.patient.email}</div>
                                        )}
                                        {currentAppointment.patient.phone && (
                                            <div style={{ fontSize: '12px', color: '#666' }}>{currentAppointment.patient.phone}</div>
                                        )}
                                    </>
                                )}
                                {currentAppointment.clientAccount && !currentAppointment.patient && ( // Only show clientAccount if patient is not available
                                    <>
                                        <div style={{ fontSize: '12px', color: '#666' }}>{currentAppointment.clientAccount.email}</div>
                                        <div style={{ fontSize: '12px', color: '#666' }}>{currentAppointment.clientAccount.phone}</div>
                                    </>
                                )}
                            </div>

                            {/* Service Info */}
                            <div>
                                <strong style={{ display: 'block', marginBottom: '5px', color: '#5D4E37' }}>Service:</strong>
                                <div>{currentAppointment.service?.name || 'N/A'}</div>
                                <div style={{ fontSize: '12px', color: '#666' }}>
                                    ₱{Number(currentAppointment.service?.price || 0).toLocaleString()}
                                </div>
                            </div>

                            {/* Doctor Info */}
                            <div>
                                <strong style={{ display: 'block', marginBottom: '5px', color: '#5D4E37' }}>Doctor:</strong>
                                <div>{currentAppointment.doctor?.full_name || 'Unassigned'}</div>
                            </div>

                            {/* Appointment Type */}
                            <div>
                                <strong style={{ display: 'block', marginBottom: '5px', color: '#5D4E37' }}>Type:</strong>
                                <div style={{ textTransform: 'capitalize' }}>{currentAppointment.appointment_type}</div>
                            </div>

                            {/* Date */}
                            <div>
                                <strong style={{ display: 'block', marginBottom: '5px', color: '#5D4E37' }}>Date:</strong>
                                <div>{new Date(currentAppointment.appointment_date).toLocaleDateString()}</div>
                            </div>

                            {/* Time */}
                            <div>
                                <strong style={{ display: 'block', marginBottom: '5px', color: '#5D4E37' }}>Time:</strong>
                                <div>{currentAppointment.appointment_time}</div>
                            </div>

                            {/* Booked On */}
                            <div>
                                <strong style={{ display: 'block', marginBottom: '5px', color: '#5D4E37' }}>Booked On:</strong>
                                <div>{new Date(currentAppointment.created_at).toLocaleDateString()}</div>
                            </div>

                            {/* Status */}
                            <div>
                                <strong style={{ display: 'block', marginBottom: '5px', color: '#5D4E37' }}>Current Status:</strong>
                                <div>
                                    <span className={`status-badge ${getStatusBadgeClass(currentAppointment.status)}`}>
                                        {currentAppointment.status}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Notes */}
                        {currentAppointment.notes && (
                            <div style={{ marginBottom: '20px' }}>
                                <strong style={{ display: 'block', marginBottom: '5px', color: '#5D4E37' }}>Notes:</strong>
                                <div style={{ padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '4px', fontSize: '14px' }}>
                                    {currentAppointment.notes}
                                </div>
                            </div>
                        )}

                        {/* Prescription Details (for completed appointments) */}
                        {currentAppointment.status === 'Completed' && currentAppointment.prescription && (
                            <div style={{ marginBottom: '20px', padding: '16px', backgroundColor: '#FFFBF0', borderRadius: '8px', border: '1px solid #E0D5C7' }}>
                                <strong style={{ display: 'block', marginBottom: '12px', color: '#5D4E37', fontSize: '15px' }}>
                                    📋 Doctor's Prescription
                                </strong>

                                {currentAppointment.prescription.product_required && (
                                    <div style={{
                                        padding: '10px 14px', marginBottom: '12px', borderRadius: '6px',
                                        backgroundColor: '#FFF3E0', border: '1px solid #FFB74D',
                                        fontSize: '13px', color: '#E65100', fontWeight: '600',
                                        display: 'flex', alignItems: 'center', gap: '8px'
                                    }}>
                                        ⚠️ Product purchase required (e.g., eyeglasses, contact lenses)
                                    </div>
                                )}

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
                                    {currentAppointment.prescription.medical_concern && (
                                        <div style={{ gridColumn: '1 / -1' }}>
                                            <strong style={{ color: '#5D4E37' }}>Medical Concern:</strong>
                                            <div style={{ marginTop: '4px', color: '#333' }}>{currentAppointment.prescription.medical_concern}</div>
                                        </div>
                                    )}

                                    {currentAppointment.prescription.recommendation && (
                                        <div style={{ gridColumn: '1 / -1' }}>
                                            <strong style={{ color: '#5D4E37' }}>Recommendation:</strong>
                                            <div style={{ marginTop: '4px', color: '#333' }}>{currentAppointment.prescription.recommendation}</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #E0D5C7' }}>
                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                                {/* Show Approve and Cancel buttons for Pending appointments */}
                                {currentAppointment.status?.toLowerCase() === 'pending' && (
                                    <>
                                        <button
                                            onClick={handleApprove}
                                            style={{
                                                padding: '12px 40px',
                                                backgroundColor: '#4CAF50',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                fontSize: '16px',
                                                fontWeight: '700',
                                                minWidth: '140px',
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                            }}
                                        >
                                            ✓ Approve
                                        </button>
                                        <button
                                            onClick={handleCancel}
                                            style={{
                                                padding: '12px 40px',
                                                backgroundColor: '#f44336',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                fontSize: '16px',
                                                fontWeight: '700',
                                                minWidth: '140px',
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                            }}
                                        >
                                            ✕ Cancel
                                        </button>
                                    </>
                                )}

                                {/* Show Mark as Ongoing button for Approved appointments */}
                                {currentAppointment.status?.toLowerCase() === 'approved' && (
                                    <button
                                        onClick={handleMarkOngoing}
                                        style={{
                                            padding: '12px 40px',
                                            backgroundColor: '#2196F3',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            fontSize: '16px',
                                            fontWeight: '700',
                                            minWidth: '180px',
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                        }}
                                    >
                                        ▶ Mark as Ongoing
                                    </button>
                                )}

                                {/* Show Mark as Completed button for Ongoing appointments */}
                                {currentAppointment.status?.toLowerCase() === 'ongoing' && (
                                    <button
                                        onClick={handleMarkCompleted}
                                        style={{
                                            padding: '12px 40px',
                                            backgroundColor: '#4CAF50',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            fontSize: '16px',
                                            fontWeight: '700',
                                            minWidth: '200px',
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                        }}
                                    >
                                        ✓ Mark as Completed
                                    </button>
                                )}

                                {/* Show message for completed/cancelled appointments */}
                                {!['pending', 'approved', 'ongoing'].includes(currentAppointment.status?.toLowerCase()) && (
                                    <div style={{ textAlign: 'center', color: '#666', fontStyle: 'italic', padding: '10px' }}>
                                        This appointment is {currentAppointment.status?.toLowerCase()}. No actions available.
                                    </div>
                                )}
                            </div>

                            {/* Close Button */}
                            <div style={{ marginTop: '15px', textAlign: 'center' }}>
                                <button
                                    onClick={() => setShowViewModal(false)}
                                    style={{
                                        padding: '10px 30px',
                                        backgroundColor: '#666',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        fontWeight: '600'
                                    }}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {NotificationModal}
        </div>
    );
};

export default AdminAppointments;
