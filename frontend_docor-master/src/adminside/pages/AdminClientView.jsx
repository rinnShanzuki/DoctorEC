import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminClientView = () => {
    const navigate = useNavigate();
    const iframeRef = useRef(null);
    const [isEditing, setIsEditing] = useState(false);

    const toggleEditMode = () => {
        const newEditState = !isEditing;
        setIsEditing(newEditState);

        if (iframeRef.current && iframeRef.current.contentWindow) {
            iframeRef.current.contentWindow.postMessage({
                type: 'TOGGLE_EDIT_MODE',
                isEditing: newEditState
            }, '*');
        }
    };

    return (
        <div style={{ position: 'relative', width: '100%', height: 'calc(100vh - 100px)' }}>
            <div style={{ width: '100%', height: '100%', overflow: 'hidden', borderRadius: '8px', border: '1px solid #E0D5C7' }}>
                <iframe
                    ref={iframeRef}
                    src="/"
                    title="Client Site View"
                    style={{ width: '100%', height: '100%', border: 'none' }}
                />
            </div>

            {/* Floating Site Editor Button */}
            <button
                onClick={toggleEditMode}
                style={{
                    position: 'absolute',
                    bottom: '20px',
                    left: '20px',
                    backgroundColor: isEditing ? '#D32F2F' : '#5D4E37',
                    color: '#F5F1E8',
                    border: 'none',
                    borderRadius: '50px',
                    padding: '15px 25px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(93, 78, 55, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    transition: 'all 0.3s ease',
                    zIndex: 1000
                }}
                onMouseEnter={(e) => {
                    e.target.style.backgroundColor = isEditing ? '#B71C1C' : '#4A3D2A';
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 6px 16px rgba(93, 78, 55, 0.4)';
                }}
                onMouseLeave={(e) => {
                    e.target.style.backgroundColor = isEditing ? '#D32F2F' : '#5D4E37';
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 12px rgba(93, 78, 55, 0.3)';
                }}
            >
                <span style={{ fontSize: '20px' }}>{isEditing ? '❌' : '✏️'}</span>
                <span>{isEditing ? 'Exit Edit Mode' : 'Edit Site'}</span>
            </button>
        </div>
    );
};

export default AdminClientView;
