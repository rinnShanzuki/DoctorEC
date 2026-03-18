import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import './PatientDetails.css';

/* ── Reusable Prescription Card ── */
const VisionTableReadOnly = ({ prefix, label, pres }) => {
    const hasData = ['od', 'os'].some(eye =>
        pres[`${prefix}_${eye}_sph`] || pres[`${prefix}_${eye}_add`] || pres[`${prefix}_${eye}_va`]
    );
    if (!hasData) return null;
    const cellStyle = { padding: '8px 10px', textAlign: 'center', fontSize: '13px', borderBottom: '1px solid #F0EAE2' };
    const thStyle = { padding: '8px 6px', fontSize: '11px', fontWeight: '700', color: '#5D4E37', textTransform: 'uppercase', borderBottom: '2px solid #E0D5C7', textAlign: 'center', backgroundColor: '#FAF6F1' };
    return (
        <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#5D4E37', marginBottom: '6px', textTransform: 'uppercase' }}>{label}</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #E0D5C7', borderRadius: '6px', overflow: 'hidden' }}>
                <thead><tr>
                    <th style={{ ...thStyle, width: '50px' }}></th>
                    <th style={thStyle}></th>
                    <th style={{ ...thStyle, width: '20%' }}>ADD</th>
                    <th style={{ ...thStyle, width: '20%' }}>VA</th>
                </tr></thead>
                <tbody>
                    {['od', 'os'].map(eye => (
                        <tr key={eye}>
                            <td style={{ ...cellStyle, fontWeight: '700', color: '#5D4E37' }}>{eye.toUpperCase()}</td>
                            <td style={cellStyle}>{pres[`${prefix}_${eye}_sph`] || '—'}</td>
                            <td style={cellStyle}>{pres[`${prefix}_${eye}_add`] || '—'}</td>
                            <td style={cellStyle}>{pres[`${prefix}_${eye}_va`] || '—'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const PrescriptionCard = ({ pres, formatDate }) => {
    const [expanded, setExpanded] = useState(false);
    const hasLensDetails = pres.frame || pres.brand || pres.lens || pres.tint || pres.pd;
    return (
        <div style={{ border: '1px solid #E0D5C7', borderRadius: '10px', marginBottom: '12px', overflow: 'hidden', backgroundColor: '#FDFAF7' }}>
            <div onClick={() => setExpanded(!expanded)}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', cursor: 'pointer', backgroundColor: expanded ? '#F5F0EA' : '#FDFAF7', transition: 'background 0.2s' }}>
                <div>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#5D4E37' }}>
                        {pres.service_name || 'Consultation'} — {formatDate(pres.appointment_date || pres.created_at)}
                    </div>
                    <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>
                        {pres.medical_concern ? pres.medical_concern.substring(0, 80) + (pres.medical_concern.length > 80 ? '...' : '') : 'No chief complaint recorded'}
                    </div>
                </div>
                <span style={{ fontSize: '18px', color: '#8B7355', transition: 'transform 0.2s', transform: expanded ? 'rotate(180deg)' : 'none' }}>▼</span>
            </div>
            {expanded && (
                <div style={{ padding: '18px', borderTop: '1px solid #E0D5C7' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                        <VisionTableReadOnly prefix="rx" label="℞ Refraction" pres={pres} />
                        <VisionTableReadOnly prefix="px" label="Prescription" pres={pres} />
                    </div>
                    {(pres.pd || pres.is_spectacle || pres.is_contact_lens) && (
                        <div style={{ display: 'flex', gap: '20px', marginBottom: '12px', flexWrap: 'wrap' }}>
                            {pres.pd && <span style={{ fontSize: '13px' }}><strong>PD:</strong> {pres.pd}</span>}
                            {pres.is_spectacle && <span style={{ fontSize: '13px', color: '#137333' }}>✅ Spectacle</span>}
                            {pres.is_contact_lens && <span style={{ fontSize: '13px', color: '#137333' }}>✅ Contact Lens</span>}
                        </div>
                    )}
                    {hasLensDetails && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', marginBottom: '12px', padding: '12px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #F0EAE2' }}>
                            {[['Frame', pres.frame], ['Brand', pres.brand], ['Lens', pres.lens], ['Tint', pres.tint], ['PD', pres.pd]].map(([label, val]) =>
                                val ? <div key={label}><div style={{ fontSize: '11px', fontWeight: '700', color: '#888', textTransform: 'uppercase' }}>{label}</div><div style={{ fontSize: '14px', fontWeight: '600', color: '#333' }}>{val}</div></div> : null
                            )}
                        </div>
                    )}
                    {pres.remarks && (
                        <div style={{ marginBottom: '12px' }}>
                            <div style={{ fontSize: '11px', fontWeight: '700', color: '#888', textTransform: 'uppercase', marginBottom: '4px' }}>Remarks</div>
                            <div style={{ fontSize: '13px', color: '#333', whiteSpace: 'pre-wrap' }}>{pres.remarks}</div>
                        </div>
                    )}
                    {pres.recommendation && (
                        <div style={{ marginBottom: '12px' }}>
                            <div style={{ fontSize: '11px', fontWeight: '700', color: '#888', textTransform: 'uppercase', marginBottom: '4px' }}>Recommendation</div>
                            <div style={{ fontSize: '13px', color: '#333', whiteSpace: 'pre-wrap' }}>{pres.recommendation}</div>
                        </div>
                    )}
                    {pres.product_required && (
                        <div style={{ fontSize: '12px', color: '#C5221F', fontWeight: '600', marginTop: '8px' }}>🛒 Product purchase required</div>
                    )}
                </div>
            )}
        </div>
    );
};

const CustomerDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [customer, setCustomer] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchCustomer();
    }, [id]);

    const fetchCustomer = async () => {
        try {
            setLoading(true);
            const response = await adminAPI.getCustomer(id);
            const data = response.data?.data || response.data || {};
            setCustomer(data);
        } catch (err) {
            console.error('Error fetching customer:', err);
            setError('Failed to load customer details.');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    if (loading) {
        return (
            <div className="patient-details">
                <div className="loading-container">
                    <div className="spinner" style={{ width: 40, height: 40, border: '4px solid #E0D5C7', borderTopColor: '#5D4E37', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
                </div>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    if (error || !customer) {
        return (
            <div className="patient-details">
                <button className="back-btn" onClick={() => navigate('/admin/dashboard/customers')}>
                    ← Back to Customers
                </button>
                <div className="empty-state">
                    <div className="empty-state-icon">❌</div>
                    <p>{error || 'Customer not found.'}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="patient-details">
            {/* Back Button */}
            <button className="back-btn" onClick={() => navigate('/admin/dashboard/customers')}>
                ← Back to Customers
            </button>

            {/* Page Title */}
            <h1 className="page-title">{customer.name}</h1>
            <p className="page-subtitle">Customer No. {customer.customer_code || `#${customer.customer_id}`}</p>

            {/* Customer Information */}
            <div className="info-card">
                <h2>📋 Customer Information</h2>
                <div className="info-grid">
                    <div className="info-item">
                        <span className="info-label">Customer No.</span>
                        <span className="info-value">{customer.customer_code || `#${customer.customer_id}`}</span>
                    </div>
                    <div className="info-item">
                        <span className="info-label">Full Name</span>
                        <span className="info-value">{customer.name}</span>
                    </div>
                    <div className="info-item">
                        <span className="info-label">Birthday</span>
                        <span className="info-value">{customer.birthdate ? formatDate(customer.birthdate) : 'N/A'}</span>
                    </div>
                    <div className="info-item">
                        <span className="info-label">Age</span>
                        <span className="info-value">{customer.age != null ? `${customer.age} years old` : 'N/A'}</span>
                    </div>
                    <div className="info-item">
                        <span className="info-label">Email</span>
                        <span className="info-value">{customer.email || 'N/A'}</span>
                    </div>
                    <div className="info-item">
                        <span className="info-label">Contact No.</span>
                        <span className="info-value">{customer.phone || 'N/A'}</span>
                    </div>
                </div>
            </div>

            {/* Prescription Records */}
            <div className="section-card">
                <h2>
                    📋 Prescription Records
                    <span className="badge">{(customer.prescriptions || []).length}</span>
                </h2>
                {customer.prescriptions && customer.prescriptions.length > 0 ? (
                    customer.prescriptions.map(pres => (
                        <PrescriptionCard key={pres.id} pres={pres} formatDate={formatDate} />
                    ))
                ) : (
                    <div className="empty-state">
                        <div className="empty-state-icon">📋</div>
                        <p>No prescription records available.</p>
                    </div>
                )}
            </div>

            {/* Product Purchases */}
            <div className="section-card">
                <h2>
                    🛒 Product Purchased (History)
                    <span className="badge">{(customer.purchases || []).length}</span>
                </h2>
                {customer.purchases && customer.purchases.length > 0 ? (
                    <table className="section-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Receipt No.</th>
                                <th>Products</th>
                                <th>Total</th>
                                <th>Payment</th>
                            </tr>
                        </thead>
                        <tbody>
                            {customer.purchases.map(purchase => (
                                <tr key={purchase.id}>
                                    <td>{formatDate(purchase.transaction_date)}</td>
                                    <td style={{ fontWeight: '600', color: '#5D4E37' }}>
                                        {purchase.receipt_number || 'N/A'}
                                    </td>
                                    <td>
                                        <div className="purchase-items">
                                            {purchase.items && purchase.items.length > 0
                                                ? purchase.items.map((item, i) => (
                                                    <span key={i} className="purchase-item-tag">
                                                        {item.product_name} ×{item.quantity}
                                                    </span>
                                                ))
                                                : <span style={{ color: '#999' }}>N/A</span>
                                            }
                                        </div>
                                    </td>
                                    <td style={{ fontWeight: '600' }}>
                                        ₱{parseFloat(purchase.total_amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td style={{ textTransform: 'capitalize' }}>
                                        {purchase.payment_method || 'N/A'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="empty-state">
                        <div className="empty-state-icon">🛒</div>
                        <p>No product purchase history found.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CustomerDetails;
