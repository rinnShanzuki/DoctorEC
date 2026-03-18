import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import { cachedGet, invalidateCache } from '../../services/apiCache';
import { useNotification } from '../hooks/useNotification';
import './Dashboard.css';
import { FaPlus, FaTrash, FaEye } from 'react-icons/fa';

const DoctorsPage = () => {
    const navigate = useNavigate();
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const { showNotification, NotificationModal } = useNotification();

    const [doctorForm, setDoctorForm] = useState({
        full_name: '',
        email: '',
        password: '',
        specialization: '',
        position: '',
        birthday: '',
        bio: '',
        image: null,
        imagePreview: null,
    });

    useEffect(() => {
        fetchDoctors();
    }, []);

    const fetchDoctors = async () => {
        try {
            const { data: response, fromCache } = await cachedGet('/doctors');
            const data = response.data?.data || response.data || [];
            setDoctors(Array.isArray(data) ? data : []);
            // Hide spinner immediately if data came from cache
            if (fromCache) setLoading(false);
        } catch (error) {
            console.error('Error fetching doctors:', error);
            setDoctors([]);
        } finally {
            setLoading(false);
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setDoctorForm(prev => ({
                ...prev,
                image: file,
                imagePreview: URL.createObjectURL(file),
            }));
        }
    };

    const handleAddDoctor = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            const formData = new FormData();
            formData.append('full_name', doctorForm.full_name);
            formData.append('email', doctorForm.email || '');
            if (doctorForm.password) {
                formData.append('password', doctorForm.password);
            }
            formData.append('specialization', doctorForm.specialization);
            formData.append('position', doctorForm.position || '');
            formData.append('birthday', doctorForm.birthday || '');
            formData.append('bio', doctorForm.bio || '');
            if (doctorForm.image) {
                formData.append('image', doctorForm.image);
            }

            await adminAPI.createDoctor(formData);
            invalidateCache('/doctors');
            await fetchDoctors();
            setShowAddModal(false);
            setDoctorForm({ full_name: '', email: '', password: '', specialization: '', position: '', birthday: '', bio: '', image: null, imagePreview: null });
            showNotification('Doctor added successfully!', 'success');
        } catch (error) {
            console.error('Error adding doctor:', error);
            showNotification('Failed to add doctor.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleRemoveDoctor = async (doctor) => {
        if (!window.confirm(`Are you sure you want to remove Dr. ${doctor.full_name}? This action cannot be undone.`)) return;
        try {
            await adminAPI.deleteDoctor(doctor.doctor_id);
            invalidateCache('/doctors');
            await fetchDoctors();
            showNotification('Doctor removed successfully!', 'success');
        } catch (error) {
            console.error('Error removing doctor:', error);
            showNotification('Failed to remove doctor.', 'error');
        }
    };

    const getStatusBadge = (status) => {
        const s = (status || '').toLowerCase();
        if (s === 'on-duty') return { label: 'On Duty', bg: '#D4EDDA', color: '#155724', dot: '#28a745' };
        if (s === 'on-leave') return { label: 'On Leave', bg: '#FFF3CD', color: '#856404', dot: '#ffc107' };
        return { label: 'Inactive', bg: '#E2E3E5', color: '#6C757D', dot: '#6c757d' };
    };

    if (loading) return <div className="dashboard-loading"><div className="spinner"></div></div>;

    return (
        <div className="dashboard">
            {NotificationModal}

            {/* Header */}
            <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1>Doctors</h1>
                    <p className="dashboard-subtitle">Manage doctor profiles and view schedules</p>
                </div>
                <button
                    onClick={() => {
                        setDoctorForm({ full_name: '', email: '', password: '', specialization: '', position: '', birthday: '', bio: '', image: null, imagePreview: null });
                        setShowAddModal(true);
                    }}
                    style={{
                        backgroundColor: '#5D4E37',
                        color: 'white',
                        border: 'none',
                        padding: '12px 24px',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'all 0.2s ease',
                        fontFamily: 'Calibri, sans-serif',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                >
                    <FaPlus /> Add Doctor
                </button>
            </div>

            {/* Doctor Cards List */}
            {doctors.length > 0 ? (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px',
                    marginTop: '10px',
                }}>
                    {doctors.map(doctor => {
                        const badge = getStatusBadge(doctor.status);
                        return (
                            <div key={doctor.doctor_id} style={{
                                backgroundColor: 'white',
                                borderRadius: '14px',
                                padding: '20px 28px',
                                boxShadow: '0 2px 10px rgba(93, 78, 55, 0.06)',
                                border: '1px solid #F0EBE3',
                                transition: 'all 0.25s ease',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '20px',
                            }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.boxShadow = '0 4px 20px rgba(93, 78, 55, 0.12)';
                                    e.currentTarget.style.borderColor = '#E0D5C7';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.boxShadow = '0 2px 10px rgba(93, 78, 55, 0.06)';
                                    e.currentTarget.style.borderColor = '#F0EBE3';
                                }}
                            >
                                {/* Profile Picture */}
                                <div style={{
                                    width: '70px',
                                    height: '70px',
                                    borderRadius: '50%',
                                    overflow: 'hidden',
                                    border: '3px solid #E0D5C7',
                                    flexShrink: 0,
                                    backgroundColor: '#F9F5F0',
                                }}>
                                    <img
                                        src={doctor.image || 'https://via.placeholder.com/150?text=Dr'}
                                        alt={doctor.full_name}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        onError={(e) => { e.target.src = 'https://via.placeholder.com/150?text=Dr'; }}
                                    />
                                </div>

                                {/* Doctor Info */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <h3 style={{
                                        fontFamily: 'Calibri, sans-serif',
                                        fontSize: '16px',
                                        fontWeight: '700',
                                        color: '#5D4E37',
                                        margin: '0 0 4px 0',
                                    }}>
                                        {doctor.full_name}
                                    </h3>
                                    <p style={{
                                        fontFamily: 'Calibri, sans-serif',
                                        fontSize: '13px',
                                        color: '#8B7355',
                                        margin: '0 0 8px 0',
                                        fontWeight: '500',
                                    }}>
                                        {doctor.specialization || 'General Practice'}
                                    </p>
                                    {/* Status Badge */}
                                    <div style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        padding: '4px 12px',
                                        borderRadius: '20px',
                                        backgroundColor: badge.bg,
                                    }}>
                                        <div style={{
                                            width: '7px',
                                            height: '7px',
                                            borderRadius: '50%',
                                            backgroundColor: badge.dot,
                                        }}></div>
                                        <span style={{
                                            fontFamily: 'Calibri, sans-serif',
                                            fontSize: '11px',
                                            fontWeight: '600',
                                            color: badge.color,
                                        }}>
                                            {badge.label}
                                        </span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                                    <button
                                        onClick={() => navigate(`/admin/dashboard/doctor/${doctor.doctor_id}`)}
                                        style={{
                                            background: 'linear-gradient(135deg, #5D4E37, #8B7355)',
                                            color: 'white',
                                            border: 'none',
                                            padding: '10px 22px',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            fontSize: '13px',
                                            fontWeight: '600',
                                            fontFamily: 'Calibri, sans-serif',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            transition: 'all 0.2s ease',
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                                        onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                                    >
                                        <FaEye /> View
                                    </button>
                                    <button
                                        onClick={() => handleRemoveDoctor(doctor)}
                                        style={{
                                            background: 'none',
                                            border: '1px solid #E0D5C7',
                                            borderRadius: '8px',
                                            padding: '9px 12px',
                                            cursor: 'pointer',
                                            color: '#bbb',
                                            fontSize: '13px',
                                            transition: 'all 0.2s ease',
                                            display: 'flex',
                                            alignItems: 'center',
                                        }}
                                        onMouseEnter={(e) => { e.currentTarget.style.color = '#dc3545'; e.currentTarget.style.borderColor = '#dc3545'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.color = '#bbb'; e.currentTarget.style.borderColor = '#E0D5C7'; }}
                                        title="Remove Doctor"
                                    >
                                        <FaTrash />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div style={{
                    textAlign: 'center',
                    padding: '80px 20px',
                    backgroundColor: 'white',
                    borderRadius: '16px',
                    border: '1px solid #F0EBE3',
                    marginTop: '10px',
                }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>👨‍⚕️</div>
                    <p style={{ fontFamily: 'Calibri, sans-serif', fontSize: '16px', color: '#999' }}>
                        No doctors found. Click "Add Doctor" to get started.
                    </p>
                </div>
            )}

            {/* Add Doctor Modal */}
            {showAddModal && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                }}
                    onClick={() => setShowAddModal(false)}
                >
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '16px',
                        padding: '32px',
                        width: '90%',
                        maxWidth: '500px',
                        maxHeight: '90vh',
                        overflowY: 'auto',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
                    }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 style={{ fontFamily: 'Calibri, sans-serif', fontSize: '20px', color: '#5D4E37', marginBottom: '24px' }}>
                            Add New Doctor
                        </h2>
                        <form onSubmit={handleAddDoctor}>
                            {/* Image Upload */}
                            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                                <div style={{
                                    width: '90px', height: '90px', borderRadius: '50%', overflow: 'hidden',
                                    margin: '0 auto 10px', border: '3px solid #E0D5C7', backgroundColor: '#F9F5F0',
                                    cursor: 'pointer',
                                }}
                                    onClick={() => document.getElementById('doctor-image-input').click()}
                                >
                                    {doctorForm.imagePreview ? (
                                        <img src={doctorForm.imagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#aaa', fontSize: '24px' }}>📷</div>
                                    )}
                                </div>
                                <input id="doctor-image-input" type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
                                <p style={{ fontSize: '12px', color: '#999', fontFamily: 'Calibri, sans-serif' }}>Click to upload photo</p>
                            </div>

                            {/* Doctor Profile Fields */}
                            {[
                                { label: 'Full Name *', field: 'full_name', type: 'text', required: true },
                                { label: 'Specialization *', field: 'specialization', type: 'text', required: true },
                                { label: 'Position', field: 'position', type: 'text' },
                                { label: 'Birthday', field: 'birthday', type: 'date' },
                            ].map(({ label, field, type, required }) => (
                                <div key={field} style={{ marginBottom: '16px' }}>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#5D4E37', marginBottom: '6px', fontFamily: 'Calibri, sans-serif' }}>
                                        {label}
                                    </label>
                                    <input
                                        type={type}
                                        value={doctorForm[field]}
                                        onChange={(e) => setDoctorForm(prev => ({ ...prev, [field]: e.target.value }))}
                                        required={required}
                                        style={{
                                            width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #E0D5C7',
                                            fontSize: '14px', fontFamily: 'Calibri, sans-serif', boxSizing: 'border-box',
                                        }}
                                    />
                                </div>
                            ))}

                            {/* Login Account Section */}
                            <div style={{
                                background: '#F8F6F2', borderRadius: '10px', padding: '16px',
                                marginBottom: '16px', border: '1px solid #E0D5C7',
                            }}>
                                <h4 style={{ fontFamily: 'Calibri, sans-serif', fontSize: '14px', color: '#5D4E37', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    🔐 Login Account
                                </h4>
                                <p style={{ fontFamily: 'Calibri, sans-serif', fontSize: '11px', color: '#8B7355', margin: '0 0 12px 0' }}>
                                    Set credentials so the doctor can log in to the Doctor Portal.
                                </p>
                                <div style={{ marginBottom: '12px' }}>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#5D4E37', marginBottom: '6px', fontFamily: 'Calibri, sans-serif' }}>
                                        Email *
                                    </label>
                                    <input
                                        type="email"
                                        value={doctorForm.email}
                                        onChange={(e) => setDoctorForm(prev => ({ ...prev, email: e.target.value }))}
                                        required
                                        placeholder="doctor@clinic.com"
                                        style={{
                                            width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #E0D5C7',
                                            fontSize: '14px', fontFamily: 'Calibri, sans-serif', boxSizing: 'border-box',
                                        }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#5D4E37', marginBottom: '6px', fontFamily: 'Calibri, sans-serif' }}>
                                        Password *
                                    </label>
                                    <input
                                        type="password"
                                        value={doctorForm.password}
                                        onChange={(e) => setDoctorForm(prev => ({ ...prev, password: e.target.value }))}
                                        required
                                        placeholder="Min. 6 characters"
                                        minLength={6}
                                        style={{
                                            width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #E0D5C7',
                                            fontSize: '14px', fontFamily: 'Calibri, sans-serif', boxSizing: 'border-box',
                                        }}
                                    />
                                </div>
                            </div>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#5D4E37', marginBottom: '6px', fontFamily: 'Calibri, sans-serif' }}>
                                    Bio
                                </label>
                                <textarea
                                    value={doctorForm.bio}
                                    onChange={(e) => setDoctorForm(prev => ({ ...prev, bio: e.target.value }))}
                                    rows={3}
                                    style={{
                                        width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #E0D5C7',
                                        fontSize: '14px', fontFamily: 'Calibri, sans-serif', resize: 'vertical', boxSizing: 'border-box',
                                    }}
                                />
                            </div>

                            {/* Buttons */}
                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    style={{
                                        padding: '10px 24px', borderRadius: '8px', border: '1px solid #E0D5C7',
                                        backgroundColor: 'white', color: '#5D4E37', cursor: 'pointer', fontSize: '14px',
                                        fontWeight: '600', fontFamily: 'Calibri, sans-serif',
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    style={{
                                        padding: '10px 24px', borderRadius: '8px', border: 'none',
                                        backgroundColor: '#5D4E37', color: 'white', cursor: saving ? 'not-allowed' : 'pointer',
                                        fontSize: '14px', fontWeight: '600', fontFamily: 'Calibri, sans-serif',
                                        opacity: saving ? 0.7 : 1,
                                    }}
                                >
                                    {saving ? 'Saving...' : 'Add Doctor'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DoctorsPage;
