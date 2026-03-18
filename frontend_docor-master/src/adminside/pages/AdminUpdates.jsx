import React, { useState } from 'react';
import '../pages/Dashboard.css';

const AdminUpdates = () => {
    // Mock Data
    const updates = [
        { id: 1, type: 'Alert', message: 'System maintenance scheduled for Sunday at 2:00 AM.', date: '2023-11-28', status: 'Pending' },
        { id: 2, type: 'Feedback', message: 'Patient John Doe submitted a positive review.', date: '2023-11-27', status: 'New' },
        { id: 3, type: 'Alert', message: 'Low stock warning: Glass Model 5.', date: '2023-11-26', status: 'Resolved' },
        { id: 4, type: 'Appointment', message: 'Appointment #1023 was cancelled by the user.', date: '2023-11-25', status: 'Acknowledged' },
    ];

    const [typeFilter, setTypeFilter] = useState('All');
    const [statusFilter, setStatusFilter] = useState('All');

    const filteredUpdates = updates.filter(update => {
        const matchesType = typeFilter === 'All' || update.type === typeFilter;
        const matchesStatus = statusFilter === 'All' || update.status === statusFilter;
        return matchesType && matchesStatus;
    });

    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <h1>Updates & Alerts</h1>
                <p className="dashboard-subtitle">System notifications and feedback</p>
            </div>

            {/* Filters */}
            <div style={{ marginBottom: '20px', display: 'flex', gap: '15px' }}>
                <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    style={{
                        padding: '10px',
                        borderRadius: '6px',
                        border: '1px solid #E0D5C7',
                        fontFamily: 'Calibri, sans-serif'
                    }}
                >
                    <option value="All">All Types</option>
                    <option value="Alert">Alert</option>
                    <option value="Feedback">Feedback</option>
                    <option value="Appointment">Appointment</option>
                </select>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    style={{
                        padding: '10px',
                        borderRadius: '6px',
                        border: '1px solid #E0D5C7',
                        fontFamily: 'Calibri, sans-serif'
                    }}
                >
                    <option value="All">All Status</option>
                    <option value="Pending">Pending</option>
                    <option value="New">New</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Acknowledged">Acknowledged</option>
                </select>
            </div>

            <div className="chart-container" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {filteredUpdates.map(update => (
                        <div key={update.id} style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '15px',
                            border: '1px solid #eee',
                            borderRadius: '8px',
                            borderLeft: `4px solid ${update.type === 'Alert' ? '#c62828' : update.type === 'Feedback' ? '#2e7d32' : '#f57c00'}`
                        }}>
                            <div style={{ marginRight: '15px', fontSize: '24px' }}>
                                {update.type === 'Alert' ? '⚠️' : update.type === 'Feedback' ? '💬' : '📅'}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                    <h4 style={{ margin: 0, color: '#333' }}>{update.type}</h4>
                                    <span style={{ fontSize: '12px', color: '#999' }}>{update.date}</span>
                                </div>
                                <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>{update.message}</p>
                            </div>
                            <div style={{ marginLeft: '15px' }}>
                                <button style={{
                                    padding: '6px 12px',
                                    backgroundColor: 'white',
                                    border: '1px solid #ccc',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '12px'
                                }}>
                                    Dismiss
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AdminUpdates;
