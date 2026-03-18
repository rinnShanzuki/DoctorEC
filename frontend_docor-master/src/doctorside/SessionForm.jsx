import React, { useState, useCallback } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import { FaArrowLeft, FaUser, FaCalendarAlt, FaClock, FaStethoscope, FaNotesMedical, FaCheckCircle, FaGlasses, FaPrescription, FaEye } from 'react-icons/fa';
import './DoctorLayout.css';

/* ───── Shared table styles (defined once, outside component) ───── */
const tableCellInputStyle = {
    width: '100%', padding: '8px 6px', border: '1px solid #E0D5C7', borderRadius: '6px',
    fontSize: '13px', textAlign: 'center', backgroundColor: '#FDFAF7', outline: 'none',
    fontFamily: 'Calibri, sans-serif', boxSizing: 'border-box',
};
const tableThStyle = {
    padding: '10px 6px', fontSize: '11px', fontWeight: '700', color: '#5D4E37',
    textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '2px solid #E0D5C7',
    textAlign: 'center', backgroundColor: '#FAF6F1',
};
const tableTdStyle = { padding: '6px 4px' };
const tableEyeLabelStyle = {
    fontWeight: '700', color: '#5D4E37', fontSize: '14px', padding: '10px 8px',
    whiteSpace: 'nowrap', borderRight: '2px solid #E0D5C7',
};

/* ───── Vision Table Component (defined OUTSIDE SessionForm to prevent
         re-creation on every render, which was causing inputs to lose focus) ───── */
const VisionTable = ({ prefix, title, formData, handleChange }) => (
    <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1.5px solid #E0D5C7', borderRadius: '8px' }}>
            <thead>
                <tr>
                    <th style={{ ...tableThStyle, width: '10%', borderRight: '2px solid #E0D5C7' }}>{title}</th>
                    <th style={{ ...tableThStyle }}></th>
                    <th style={{ ...tableThStyle, width: '20%' }}>ADD</th>
                    <th style={{ ...tableThStyle, width: '20%' }}>VA</th>
                </tr>
            </thead>
            <tbody>
                {['od', 'os'].map(eye => (
                    <tr key={eye} style={{ borderBottom: eye === 'od' ? '1px solid #F0EAE2' : 'none' }}>
                        <td style={tableEyeLabelStyle}>{eye.toUpperCase()}:</td>
                        <td style={tableTdStyle}>
                            <input
                                type="text"
                                name={`${prefix}_${eye}_sph`}
                                value={formData[`${prefix}_${eye}_sph`]}
                                onChange={handleChange}
                                placeholder=""
                                style={tableCellInputStyle}
                            />
                        </td>
                        <td style={tableTdStyle}>
                            <input
                                type="text"
                                name={`${prefix}_${eye}_add`}
                                value={formData[`${prefix}_${eye}_add`]}
                                onChange={handleChange}
                                placeholder="—"
                                style={tableCellInputStyle}
                            />
                        </td>
                        <td style={tableTdStyle}>
                            <input
                                type="text"
                                name={`${prefix}_${eye}_va`}
                                value={formData[`${prefix}_${eye}_va`]}
                                onChange={handleChange}
                                placeholder="—"
                                style={tableCellInputStyle}
                            />
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

const SessionForm = () => {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const appointment = location.state?.appointment;

    const [formData, setFormData] = useState({
        medical_concern: '',
        medical_history: '',
        recommendation: '',
        product_required: false,

        // Rx (Refraction Results) — blank column, ADD, VA
        rx_od_sph: '', rx_od_add: '', rx_od_va: '',
        rx_os_sph: '', rx_os_add: '', rx_os_va: '',

        // Prescription — blank column, ADD, VA
        px_od_sph: '', px_od_add: '', px_od_va: '',
        px_os_sph: '', px_os_add: '', px_os_va: '',

        // Lens Details
        pd: '',
        is_spectacle: false,
        is_contact_lens: false,
        frame: '',
        brand: '',
        lens: '',
        tint: '',

        // Other
        remarks: '',
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    /* ── Derive patient info from appointment ── */
    const patient = appointment?.patient;
    const clientAcct = appointment?.client_account || appointment?.clientAccount;

    const patientName = patient?.name
        || (clientAcct ? `${clientAcct.first_name || ''} ${clientAcct.last_name || ''}`.trim() : null)
        || 'Walk-in Patient';

    const patientEmail = patient?.email || clientAcct?.email || '—';
    const patientPhone = patient?.phone || clientAcct?.phone || '—';
    const patientGender = patient?.gender || clientAcct?.gender || '—';
    const patientOccupation = appointment?.occupation || '—';

    // Calculate age & format birthday
    const rawBirthdate = patient?.birthdate || clientAcct?.birthday || clientAcct?.birthdate || null;
    let patientBirthday = '—';
    let patientAge = '—';
    if (rawBirthdate) {
        const bDate = new Date(rawBirthdate + 'T00:00:00');
        patientBirthday = bDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        const ageDiff = Date.now() - bDate.getTime();
        patientAge = Math.floor(ageDiff / (365.25 * 24 * 60 * 60 * 1000));
    }

    const handleChange = useCallback((e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        try {
            await api.post(`/doctor/appointments/${id}/complete-session`, formData);
            navigate('/doctor/appointments', {
                state: { success: 'Session completed and prescription saved!' }
            });
        } catch (err) {
            console.error('Failed to complete session:', err);
            setError(err.response?.data?.message || 'Failed to complete session. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    /* ───── Shared Styles ───── */
    const fontStyle = { fontFamily: 'Calibri, sans-serif' };
    const labelStyle = {
        display: 'block', fontSize: '12px', fontWeight: '700', color: '#5D4E37',
        textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px'
    };
    const inputStyle = {
        width: '100%', padding: '10px 14px', borderRadius: '8px',
        border: '1.5px solid #E0D5C7', fontSize: '14px', color: '#333',
        fontFamily: 'Calibri, sans-serif', outline: 'none', boxSizing: 'border-box',
        transition: 'border-color 0.2s ease', backgroundColor: '#FDFAF7',
    };
    const textareaStyle = { ...inputStyle, resize: 'vertical', minHeight: '90px', lineHeight: '1.5' };
    const sectionStyle = {
        backgroundColor: 'white', borderRadius: '12px', padding: '24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #F0EAE2', marginBottom: '20px',
    };
    const sectionHeaderStyle = {
        display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px',
        paddingBottom: '12px', borderBottom: '2px solid #F0EAE2',
        fontSize: '15px', fontWeight: '700', color: '#5D4E37',
    };


    /* ── Info item for the banner ── */
    const InfoItem = ({ icon, label, value }) => (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <span style={{ marginTop: '4px', opacity: 0.8, flexShrink: 0, fontSize: '14px' }}>{icon}</span>
            <div>
                <div style={{ fontSize: '11px', opacity: 0.75, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '3px' }}>{label}</div>
                <div style={{ fontSize: '15px', fontWeight: '700' }}>{value}</div>
            </div>
        </div>
    );



    if (!appointment) {
        return (
            <div style={{ ...fontStyle, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '16px' }}>
                <div style={{ fontSize: '48px' }}>⚠️</div>
                <h3 style={{ color: '#5D4E37', margin: 0 }}>Appointment data not found</h3>
                <p style={{ color: '#888', margin: 0 }}>Please go back to appointments and try again.</p>
                <button onClick={() => navigate('/doctor/appointments')}
                    style={{ padding: '10px 24px', backgroundColor: '#5D4E37', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
                    ← Back to Appointments
                </button>
            </div>
        );
    }

    return (
        <div style={fontStyle}>
            {/* Page Header */}
            <div className="page-header">
                <div>
                    <h1>Prescription Form</h1>
                    <div className="breadcrumb">Doctor Portal &gt; Appointments &gt; Prescription Form</div>
                </div>
                <button onClick={() => navigate('/doctor/appointments')}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 18px', backgroundColor: 'white', color: '#5D4E37', border: '1.5px solid #E0D5C7', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
                    <FaArrowLeft /> Back to Appointments
                </button>
            </div>

            {/* Patient Info Banner */}
            <div style={{ ...sectionStyle, background: 'linear-gradient(135deg, #5D4E37 0%, #8B7355 100%)', border: 'none', color: 'white', marginBottom: '24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '18px' }}>
                    <InfoItem icon={<FaUser />} label="Patient" value={<><div>{patientName}</div><div style={{ fontSize: '12px', opacity: 0.8, fontWeight: '400' }}>{patientEmail}</div></>} />
                    <InfoItem icon={<FaStethoscope />} label="Service" value={<><div>{appointment.service?.name || 'General Appointment'}</div>{appointment.service?.price && <div style={{ fontSize: '12px', opacity: 0.8, fontWeight: '400' }}>₱{Number(appointment.service.price).toLocaleString()}</div>}</>} />
                    <InfoItem icon={<FaCalendarAlt />} label="Date" value={appointment.appointment_date ? new Date(appointment.appointment_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—'} />
                    <InfoItem icon={<FaClock />} label="Time" value={<><div>{appointment.appointment_time || '—'}</div><div style={{ display: 'inline-block', marginTop: '4px', padding: '2px 10px', backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: '10px', fontSize: '11px', fontWeight: '600' }}>🟡 Ongoing</div></>} />
                </div>
                {/* Demographic Row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px', marginTop: '18px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.2)' }}>
                    <InfoItem icon="🎂" label="Birthday" value={patientBirthday} />
                    <InfoItem icon="🧓" label="Age" value={patientAge !== '—' ? `${patientAge} yrs old` : '—'} />
                    <InfoItem icon="⚧" label="Gender" value={patientGender !== '—' ? patientGender.charAt(0).toUpperCase() + patientGender.slice(1) : '—'} />
                    <InfoItem icon="📞" label="Contact No." value={patientPhone} />
                    <InfoItem icon="💼" label="Occupation" value={patientOccupation} />
                </div>
            </div>

            {/* Error Alert */}
            {error && (
                <div style={{ backgroundColor: '#FEE8E6', color: '#C5221F', padding: '14px 16px', borderRadius: '8px', marginBottom: '20px', fontSize: '13px', border: '1px solid #FADBD8', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    ⚠️ {error}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                {/* ── Clinical Notes ── */}
                <div style={sectionStyle}>
                    <div style={sectionHeaderStyle}><FaNotesMedical /> Clinical Notes</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div>
                            <label style={labelStyle}>Chief Complaint / Medical Concern</label>
                            <textarea name="medical_concern" value={formData.medical_concern} onChange={handleChange}
                                placeholder="Describe the patient's primary concern or complaint..." style={textareaStyle} />
                        </div>
                        <div>
                            <label style={labelStyle}>Medical History & Notes</label>
                            <textarea name="medical_history" value={formData.medical_history} onChange={handleChange}
                                placeholder="Relevant medical history, previous conditions, allergies..." style={textareaStyle} />
                        </div>
                    </div>
                </div>

                {/* ── ℞ Refraction Results ── */}
                <div style={sectionStyle}>
                    <div style={sectionHeaderStyle}>
                        <FaPrescription /> <span>Refraction Results</span>
                    </div>
                    <VisionTable prefix="rx" title="Rx" formData={formData} handleChange={handleChange} />
                </div>

                {/* ── Prescription ── */}
                <div style={sectionStyle}>
                    <div style={sectionHeaderStyle}>
                        <FaEye /> Prescription
                    </div>
                    <VisionTable prefix="px" title="Px" formData={formData} handleChange={handleChange} />

                    {/* PD + Type */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginTop: '20px' }}>
                        <div>
                            <label style={labelStyle}>PD (Pupillary Distance)</label>
                            <input type="text" name="pd" value={formData.pd} onChange={handleChange}
                                placeholder="e.g., 62mm" style={inputStyle} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', paddingTop: '24px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', color: '#5D4E37' }}>
                                <input type="checkbox" name="is_spectacle" checked={formData.is_spectacle} onChange={handleChange}
                                    style={{ width: '18px', height: '18px', accentColor: '#5D4E37' }} />
                                Spectacle
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', color: '#5D4E37' }}>
                                <input type="checkbox" name="is_contact_lens" checked={formData.is_contact_lens} onChange={handleChange}
                                    style={{ width: '18px', height: '18px', accentColor: '#5D4E37' }} />
                                Contact Lens
                            </label>
                        </div>
                    </div>
                </div>

                {/* ── Lens & Frame Details ── */}
                <div style={sectionStyle}>
                    <div style={sectionHeaderStyle}><FaGlasses /> Lens & Frame Details</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div>
                            <label style={labelStyle}>Frame</label>
                            <input type="text" name="frame" value={formData.frame} onChange={handleChange}
                                placeholder="Frame type/model" style={inputStyle} />
                        </div>
                        <div>
                            <label style={labelStyle}>Brand</label>
                            <input type="text" name="brand" value={formData.brand} onChange={handleChange}
                                placeholder="Frame brand" style={inputStyle} />
                        </div>
                        <div>
                            <label style={labelStyle}>Lens</label>
                            <input type="text" name="lens" value={formData.lens} onChange={handleChange}
                                placeholder="Lens type" style={inputStyle} />
                        </div>
                        <div>
                            <label style={labelStyle}>Tint</label>
                            <input type="text" name="tint" value={formData.tint} onChange={handleChange}
                                placeholder="Lens tint color" style={inputStyle} />
                        </div>
                    </div>

                    <div style={{ marginTop: '20px' }}>
                        <label style={labelStyle}>Remarks</label>
                        <textarea name="remarks" value={formData.remarks} onChange={handleChange}
                            placeholder="Additional notes, special instructions..." style={{ ...textareaStyle, minHeight: '80px' }} />
                    </div>
                </div>

                {/* ── Recommendations ── */}
                <div style={sectionStyle}>
                    <div style={sectionHeaderStyle}><FaCheckCircle /> Recommendations & Follow-up</div>
                    <div>
                        <label style={labelStyle}>Prescription & Follow-up Instructions</label>
                        <textarea name="recommendation" value={formData.recommendation} onChange={handleChange}
                            placeholder="Prescription notes, follow-up schedule, recommended treatment or referrals..."
                            style={{ ...textareaStyle, minHeight: '110px' }} />
                    </div>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '12px', marginTop: '16px', padding: '14px 16px',
                        backgroundColor: '#FFFBF5', borderRadius: '8px', border: '1.5px solid #F0EAE2', cursor: 'pointer'
                    }}
                        onClick={() => setFormData(prev => ({ ...prev, product_required: !prev.product_required }))}
                    >
                        <div style={{
                            width: '20px', height: '20px', borderRadius: '4px',
                            border: `2px solid ${formData.product_required ? '#5D4E37' : '#ccc'}`,
                            backgroundColor: formData.product_required ? '#5D4E37' : 'white',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0, transition: 'all 0.2s'
                        }}>
                            {formData.product_required && <span style={{ color: 'white', fontSize: '13px', fontWeight: 'bold' }}>✓</span>}
                        </div>
                        <div>
                            <div style={{ fontSize: '14px', fontWeight: '600', color: '#333' }}>Product purchase required</div>
                            <div style={{ fontSize: '12px', color: '#888' }}>e.g., eyeglasses, contact lenses, or other optical products</div>
                        </div>
                    </div>
                </div>

                {/* End Session Button */}
                <div style={{ ...sectionStyle, display: 'flex', justifyContent: 'flex-end', gap: '12px', alignItems: 'center' }}>
                    <button type="button" onClick={() => navigate('/doctor/appointments')}
                        style={{ padding: '12px 28px', backgroundColor: 'white', color: '#5D4E37', border: '1.5px solid #E0D5C7', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
                        Cancel
                    </button>
                    <button type="submit" disabled={submitting}
                        style={{
                            padding: '14px 40px',
                            background: submitting ? '#ccc' : 'linear-gradient(135deg, #137333, #1e8e3e)',
                            color: 'white', border: 'none', borderRadius: '8px', cursor: submitting ? 'not-allowed' : 'pointer',
                            fontSize: '15px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px',
                            boxShadow: submitting ? 'none' : '0 4px 12px rgba(19,115,51,0.3)', transition: 'all 0.2s ease'
                        }}>
                        <FaCheckCircle />
                        {submitting ? 'Saving & Ending Session...' : 'End Session & Save Records'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default SessionForm;
