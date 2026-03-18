import React from 'react';
import AdminUsers from './AdminUsers';

const AdminHistory = ({ isEmbedded = false }) => {
    const content = (
        <>
            {!isEmbedded && (
                <div className="dashboard-header">
                    <h1>Staff Management</h1>
                </div>
            )}

            {/* Content - Only AdminUsers */}
            <div className="history-content">
                <AdminUsers />
            </div>
        </>
    );

    if (isEmbedded) {
        return <div style={{ marginTop: '20px' }}>{content}</div>;
    }

    return (
        <div className="dashboard">
            {content}
        </div>
    );
};

export default AdminHistory;
