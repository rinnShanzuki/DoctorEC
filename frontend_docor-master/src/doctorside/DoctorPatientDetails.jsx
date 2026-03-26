import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import { FaArrowLeft, FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaBirthdayCake, FaCalendarAlt, FaNotesMedical, FaShoppingBag, FaGlasses } from 'react-icons/fa';
import './DoctorLayout.css';

const DoctorPatientDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Determine if viewing a client or patient from the ID prefix
    const isClient = id.startsWith('client-');
    const realId = isClient ? id.replace('client-', '') : id;

    useEffect(() => {
        fetchDetails();
    }, [id]);

    const fetchDetails = async () => {
        try {
            setLoading(true);
            const endpoint = isClient ? `/doctor/clients/${realId}` : `/doctor/patients/${realId}`;
            const response = await api.get(endpoint);
            const d = response.data?.data || response.data || {};
            setData(d);
        } catch (err) {
            console.error('Error fetching details:', err);
            setError('Failed to load details.');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    const getStatusBadgeStyle = (status) => {
        const s = (status || '').toLowerCase();
        const styles = {
            pending: { backgroundColor: '#FFF3E0', color: '#E65100' },
            approved: { backgroundColor: '#E8F5E9', color: '#2E7D32' },
            confirmed: { backgroundColor: '#E8F5E9', color: '#2E7D32' },
            completed: { backgroundColor: '#E3F2FD', color: '#1565C0' },
            cancelled: { backgroundColor: '#FFEBEE', color: '#C62828' },
            ongoing: { backgroundColor: '#FFFDE7', color: '#F57F17' },
        };
        return {
            display: 'inline-block', padding: '4px 12px', borderRadius: '12px',
            fontSize: '12px', fontWeight: '600', textTransform: 'capitalize',
            ...(styles[s] || { backgroundColor: '#F5F5F5', color: '#666' })
        };
    };

    const fontStyle = { fontFamily: 'Calibri, sans-serif' };
    const sectionStyle = {
        backgroundColor: 'white', borderRadius: '12px', padding: '24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #F0EAE2', marginBottom: '20px',
    };
    const sectionHeaderStyle = {
        display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px',
        paddingBottom: '12px', borderBottom: '2px solid #F0EAE2',
        fontSize: '15px', fontWeight: '700', color: '#5D4E37',
    };
    const infoItemStyle = {
        display: 'flex', flexDirection: 'column', gap: '4px',
    };
    const labelStyle = {
        fontSize: '11px', fontWeight: '700', color: '#999',
        textTransform: 'uppercase', letterSpacing: '0.5px'
    };
    const valueStyle = { fontSize: '14px', fontWeight: '500', color: '#333' };

    if (loading) {
        return (
            <div style={{ ...fontStyle, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <div style={{
                    width: 40, height: 40,
                    border: '4px solid #E0D5C7', borderTopColor: '#5D4E37',
                    borderRadius: '50%', animation: 'spin 0.8s linear infinite'
                }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div style={{ ...fontStyle, textAlign: 'center', padding: '60px', color: '#888' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>❌</div>
                <h3 style={{ color: '#5D4E37' }}>{error || 'Record not found'}</h3>
                <button
                    onClick={() => navigate('/doctor/patients')}
                    style={{
                        padding: '10px 24px', marginTop: '12px',
                        backgroundColor: '#5D4E37', color: 'white', border: 'none',
                        borderRadius: '8px', cursor: 'pointer', fontWeight: '600'
                    }}
                >
                    ← Back to Patients
                </button>
            </div>
        );
    }

    const name = data.name || `${data.first_name || ''} ${data.last_name || ''}`.trim();
    const idLabel = isClient ? `Account #${data.client_id}` : (data.patient_code || `Patient #${data.patient_id}`);
    const age = data.age != null ? `${data.age} years old` : (data.birthdate ? `${new Date().getFullYear() - new Date(data.birthdate).getFullYear()} years old` : 'N/A');

    return (
        <div style={fontStyle}>
            {/* Back Button */}
            <button
                onClick={() => navigate('/doctor/patients')}
                style={{
                    display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px',
                    padding: '8px 16px', backgroundColor: 'white', color: '#5D4E37',
                    border: '1.5px solid #E0D5C7', borderRadius: '8px', cursor: 'pointer',
                    fontSize: '13px', fontWeight: '600'
                }}
            >
                <FaArrowLeft /> Back to Patients
            </button>

            {/* Patient Banner */}
            <div style={{
                ...sectionStyle,
                background: 'linear-gradient(135deg, #5D4E37 0%, #8B7355 100%)',
                border: 'none', color: 'white', marginBottom: '24px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
                    <div style={{
                        width: '56px', height: '56px', borderRadius: '50%',
                        backgroundColor: 'rgba(255,255,255,0.2)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: '700'
                    }}>
                        {name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '700' }}>{name}</h2>
                        <div style={{ opacity: 0.8, fontSize: '13px', marginTop: '4px' }}>{idLabel}</div>
                    </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <FaEnvelope style={{ opacity: 0.7 }} />
                        <div>
                            <div style={{ fontSize: '11px', opacity: 0.7 }}>Email</div>
                            <div style={{ fontSize: '14px', fontWeight: '600' }}>{data.email || 'N/A'}</div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <FaPhone style={{ opacity: 0.7 }} />
                        <div>
                            <div style={{ fontSize: '11px', opacity: 0.7 }}>Contact</div>
                            <div style={{ fontSize: '14px', fontWeight: '600' }}>{data.phone || 'N/A'}</div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <FaBirthdayCake style={{ opacity: 0.7 }} />
                        <div>
                            <div style={{ fontSize: '11px', opacity: 0.7 }}>Birthdate / Age</div>
                            <div style={{ fontSize: '14px', fontWeight: '600' }}>{data.birthdate ? formatDate(data.birthdate) : 'N/A'} · {age}</div>
                        </div>
                    </div>
                    {data.address && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <FaMapMarkerAlt style={{ opacity: 0.7 }} />
                            <div>
                                <div style={{ fontSize: '11px', opacity: 0.7 }}>Address</div>
                                <div style={{ fontSize: '14px', fontWeight: '600' }}>{data.address}</div>
                            </div>
                        </div>
                    )}
                    {data.gender && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <FaUser style={{ opacity: 0.7 }} />
                            <div>
                                <div style={{ fontSize: '11px', opacity: 0.7 }}>Gender</div>
                                <div style={{ fontSize: '14px', fontWeight: '600', textTransform: 'capitalize' }}>{data.gender}</div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Medical Records */}
            <div style={sectionStyle}>
                <div style={sectionHeaderStyle}>
                    <FaNotesMedical /> Medical Records
                    <span style={{
                        backgroundColor: '#E0D5C7', color: '#5D4E37', padding: '2px 10px',
                        borderRadius: '12px', fontSize: '12px', fontWeight: '700'
                    }}>
                        {(data.medical_records || []).length}
                    </span>
                </div>
                {data.medical_records && data.medical_records.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {data.medical_records.map((record, idx) => (
                            <div key={record.id || idx} style={{
                                padding: '14px 16px', backgroundColor: '#FDFAF7',
                                borderRadius: '8px', border: '1px solid #F0EAE2'
                            }}>
                                <div style={{ fontSize: '14px', color: '#333', lineHeight: '1.5' }}>
                                    {record.medical_history || 'No details recorded.'}
                                </div>
                                <div style={{ fontSize: '11px', color: '#999', marginTop: '8px' }}>
                                    Recorded on {formatDate(record.created_at)}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: '30px', color: '#999', fontStyle: 'italic' }}>
                        📄 No medical records available yet.
                    </div>
                )}
            </div>

            {/* Prescriptions */}
            <div style={sectionStyle}>
                <div style={sectionHeaderStyle}>
                    <FaGlasses /> Prescriptions
                    <span style={{
                        backgroundColor: '#E0D5C7', color: '#5D4E37', padding: '2px 10px',
                        borderRadius: '12px', fontSize: '12px', fontWeight: '700'
                    }}>
                        {(data.prescriptions || []).length}
                    </span>
                </div>
                {data.prescriptions && data.prescriptions.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {data.prescriptions.map((pres, idx) => (
                            <div key={pres.id || idx} style={{
                                padding: '16px', backgroundColor: '#FDFAF7',
                                borderRadius: '8px', border: '1px solid #F0EAE2'
                            }}>
                                {pres.service_name && (
                                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#5D4E37', marginBottom: '10px' }}>
                                        {pres.service_name} — {formatDate(pres.appointment_date)}
                                    </div>
                                )}
                                {pres.medical_concern && (
                                    <div style={{ marginBottom: '8px' }}>
                                        <div style={labelStyle}>Medical Concern</div>
                                        <div style={{ ...valueStyle, lineHeight: '1.5' }}>{pres.medical_concern}</div>
                                    </div>
                                )}
                                {pres.recommendation && (
                                    <div style={{ marginBottom: '8px' }}>
                                        <div style={labelStyle}>Recommendation</div>
                                        <div style={{ ...valueStyle, lineHeight: '1.5' }}>{pres.recommendation}</div>
                                    </div>
                                )}
                                {pres.product_required && (
                                    <div style={{
                                        display: 'inline-block', padding: '4px 10px',
                                        backgroundColor: '#FFF3E0', color: '#E65100',
                                        borderRadius: '6px', fontSize: '11px', fontWeight: '600'
                                    }}>
                                        Product Purchase Required
                                    </div>
                                )}
                                <div style={{ fontSize: '11px', color: '#999', marginTop: '8px' }}>
                                    Recorded on {formatDate(pres.created_at)}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: '30px', color: '#999', fontStyle: 'italic' }}>
                        👓 No prescriptions recorded yet.
                    </div>
                )}
            </div>

            {/* Appointment History */}
            <div style={sectionStyle}>
                <div style={sectionHeaderStyle}>
                    <FaCalendarAlt /> Appointment History
                    <span style={{
                        backgroundColor: '#E0D5C7', color: '#5D4E37', padding: '2px 10px',
                        borderRadius: '12px', fontSize: '12px', fontWeight: '700'
                    }}>
                        {(data.appointments || []).length}
                    </span>
                </div>
                {data.appointments && data.appointments.length > 0 ? (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid #F0EAE2', textAlign: 'left' }}>
                                    <th style={{ padding: '10px', color: '#5D4E37', fontWeight: '700', fontSize: '12px', textTransform: 'uppercase' }}>Date</th>
                                    <th style={{ padding: '10px', color: '#5D4E37', fontWeight: '700', fontSize: '12px', textTransform: 'uppercase' }}>Time</th>
                                    <th style={{ padding: '10px', color: '#5D4E37', fontWeight: '700', fontSize: '12px', textTransform: 'uppercase' }}>Service</th>
                                    <th style={{ padding: '10px', color: '#5D4E37', fontWeight: '700', fontSize: '12px', textTransform: 'uppercase' }}>Doctor</th>
                                    <th style={{ padding: '10px', color: '#5D4E37', fontWeight: '700', fontSize: '12px', textTransform: 'uppercase' }}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.appointments.map((apt, idx) => (
                                    <tr key={apt.id || idx} style={{ borderBottom: '1px solid #F0EAE2' }}>
                                        <td style={{ padding: '12px 10px' }}>{formatDate(apt.appointment_date)}</td>
                                        <td style={{ padding: '12px 10px' }}>{apt.appointment_time || 'N/A'}</td>
                                        <td style={{ padding: '12px 10px', fontWeight: '500' }}>{apt.service_name || 'General Checkup'}</td>
                                        <td style={{ padding: '12px 10px' }}>{apt.doctor_name || 'N/A'}</td>
                                        <td style={{ padding: '12px 10px' }}>
                                            <span style={getStatusBadgeStyle(apt.status)}>{apt.status}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: '30px', color: '#999', fontStyle: 'italic' }}>
                        📅 No appointment records found.
                    </div>
                )}
            </div>

            {/* Product Purchases */}
            <div style={sectionStyle}>
                <div style={sectionHeaderStyle}>
                    <FaShoppingBag /> Product Purchases
                    <span style={{
                        backgroundColor: '#E0D5C7', color: '#5D4E37', padding: '2px 10px',
                        borderRadius: '12px', fontSize: '12px', fontWeight: '700'
                    }}>
                        {(data.purchases || []).length}
                    </span>
                </div>
                {data.purchases && data.purchases.length > 0 ? (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid #F0EAE2', textAlign: 'left' }}>
                                    <th style={{ padding: '10px', color: '#5D4E37', fontWeight: '700', fontSize: '12px', textTransform: 'uppercase' }}>Date</th>
                                    <th style={{ padding: '10px', color: '#5D4E37', fontWeight: '700', fontSize: '12px', textTransform: 'uppercase' }}>Receipt No.</th>
                                    <th style={{ padding: '10px', color: '#5D4E37', fontWeight: '700', fontSize: '12px', textTransform: 'uppercase' }}>Products</th>
                                    <th style={{ padding: '10px', color: '#5D4E37', fontWeight: '700', fontSize: '12px', textTransform: 'uppercase' }}>Total</th>
                                    <th style={{ padding: '10px', color: '#5D4E37', fontWeight: '700', fontSize: '12px', textTransform: 'uppercase' }}>Payment</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.purchases.map((purchase, idx) => (
                                    <tr key={purchase.id || idx} style={{ borderBottom: '1px solid #F0EAE2' }}>
                                        <td style={{ padding: '12px 10px' }}>{formatDate(purchase.transaction_date)}</td>
                                        <td style={{ padding: '12px 10px', fontWeight: '600', color: '#5D4E37' }}>
                                            {purchase.receipt_number || 'N/A'}
                                        </td>
                                        <td style={{ padding: '12px 10px' }}>
                                            {purchase.items && purchase.items.length > 0
                                                ? purchase.items.map((item, i) => (
                                                    <span key={i} style={{
                                                        display: 'inline-block', marginRight: '6px', marginBottom: '4px',
                                                        padding: '2px 8px', backgroundColor: '#F0EAE2', borderRadius: '4px',
                                                        fontSize: '12px'
                                                    }}>
                                                        {item.product_name} ×{item.quantity}
                                                    </span>
                                                ))
                                                : <span style={{ color: '#999' }}>N/A</span>
                                            }
                                        </td>
                                        <td style={{ padding: '12px 10px', fontWeight: '600' }}>
                                            ₱{parseFloat(purchase.total_amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td style={{ padding: '12px 10px', textTransform: 'capitalize' }}>
                                            {purchase.payment_method || 'N/A'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: '30px', color: '#999', fontStyle: 'italic' }}>
                        🛒 No product purchases found.
                    </div>
                )}
            </div>
        </div>
    );
};

export default DoctorPatientDetails;
