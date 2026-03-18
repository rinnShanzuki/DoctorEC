import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useShop } from '../../context/ShopContext';

import checkUpBg from '../../assets/check-up.jpg';

const Appointments = () => {
    const { addAppointment } = useShop();
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        date: '',
        time: '',
        type: 'In-Person',
        doctor: 'Dr. Smith',
        reason: '',
    });

    const [showConfirmModal, setShowConfirmModal] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.fullName || !formData.email || !formData.date) {
            alert('Please fill in all required fields.');
            return;
        }
        setShowConfirmModal(true);
    };

    const confirmAppointment = () => {
        addAppointment(formData);
        setShowConfirmModal(false);
        // alert('Appointment Request Submitted!'); // Removed alert as per request, modal serves as confirmation
        setFormData({
            fullName: '',
            email: '',
            phone: '',
            date: '',
            time: '',
            type: 'In-Person',
            doctor: 'Dr. Smith',
            reason: '',
        });
    };

    const cancelAppointment = () => {
        setShowConfirmModal(false);
    };

    return (
        <div>
            <div style={styles.header}>
                <div style={styles.overlay}></div>
                <div className="container" style={styles.container}>
                    <h1 style={styles.title}>Schedule Your Eye Check-Up</h1>
                </div>
            </div>

            <div className="container" style={styles.contentContainer}>
                <form onSubmit={handleSubmit} style={styles.form}>
                    <h2 style={styles.formTitle}>Book Appointment</h2>

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

                    <div style={styles.row}>
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

                    <div style={styles.row}>
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Date *</label>
                            <input
                                type="date"
                                name="date"
                                value={formData.date}
                                onChange={handleChange}
                                style={styles.input}
                                required
                            />
                        </div>
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Time *</label>
                            <input
                                type="time"
                                name="time"
                                value={formData.time}
                                onChange={handleChange}
                                style={styles.input}
                                required
                            />
                        </div>
                    </div>

                    <div style={styles.row}>
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Appointment Type</label>
                            <select
                                name="type"
                                value={formData.type}
                                onChange={handleChange}
                                style={styles.select}
                            >
                                <option value="In-Person">In-Person Visit</option>
                                <option value="Phone">Phone Consultation</option>
                                <option value="Video">Video Conference</option>
                            </select>
                        </div>
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Preferred Doctor</label>
                            <select
                                name="doctor"
                                value={formData.doctor}
                                onChange={handleChange}
                                style={styles.select}
                            >
                                <option value="Dr. Smith">Dr. Smith</option>
                                <option value="Dr. Jones">Dr. Jones</option>
                                <option value="Dr. Doe">Dr. Doe</option>
                            </select>
                        </div>
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

                    <button type="submit" style={styles.submitBtn}>Confirm Appointment</button>
                </form>

                <div style={styles.sidebar}>
                    <div style={styles.guide}>
                        <h3 style={styles.sidebarTitle}>How it Works</h3>
                        <ol style={styles.list}>
                            <li>Fill out the booking form.</li>
                            <li>Receive confirmation via email.</li>
                            <li>Visit the clinic or join the call.</li>
                        </ol>
                    </div>
                    <hr style={styles.divider} />
                    <div style={styles.policy}>
                        <h3 style={styles.sidebarTitle}>Appointment Policy</h3>
                        <p style={styles.text}>
                            Please arrive 10 minutes early. Cancellations must be made at least 24 hours in advance.
                        </p>
                    </div>
                </div>
            </div>

            {/* Confirmation Modal */}
            {showConfirmModal && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalContent}>
                        <h3 style={styles.modalTitle}>Confirm Appointment</h3>
                        <p style={styles.modalText}>Are you sure you want to book this appointment?</p>
                        <div style={styles.modalActions}>
                            <button onClick={cancelAppointment} style={styles.cancelBtn}>Cancel</button>
                            <button onClick={confirmAppointment} style={styles.okBtn}>OK</button>
                        </div>
                    </div>
                </div>
            )}
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
    },
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
        maxWidth: '400px',
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
