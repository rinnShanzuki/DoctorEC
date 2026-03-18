import React, { useState } from 'react';

/**
 * Reusable Notification Modal Hook
 * Usage:
 *   const { notification, showNotification, closeNotification, NotificationModal } = useNotification();
 *   showNotification('Message here', 'success'); // types: 'error', 'warning', 'success', 'info'
 *   return <>{NotificationModal}</>;
 */

// System theme colors matching Dashboard.css
const THEME = {
    primary: '#5D4E37',       // Main brown
    primaryDark: '#3E2723',   // Dark brown
    primaryLight: '#8B7355',  // Light brown
    text: '#4A3C2A',
    background: '#F5F1EE',
    success: { color: '#388E3C', bg: '#E8F5E9' },
    warning: { color: '#F57C00', bg: '#FFF3E0' },
    error: { color: '#C62828', bg: '#FFEBEE' },
    info: { color: '#1976D2', bg: '#E3F2FD' },
};

export const useNotification = () => {
    const [notification, setNotification] = useState({ show: false, message: '', type: 'info' });

    const showNotification = (message, type = 'info') => {
        setNotification({ show: true, message, type });
    };

    const closeNotification = () => {
        setNotification({ show: false, message: '', type: 'info' });
    };

    const getTypeConfig = (type) => {
        switch (type) {
            case 'error': return { ...THEME.error, icon: '❌', title: 'Error' };
            case 'warning': return { ...THEME.warning, icon: '⚠️', title: 'Warning' };
            case 'success': return { ...THEME.success, icon: '✅', title: 'Success' };
            default: return { ...THEME.info, icon: 'ℹ️', title: 'Notice' };
        }
    };

    const config = getTypeConfig(notification.type);

    const NotificationModal = notification.show ? (
        <div
            className="modal-overlay"
            onClick={closeNotification}
            style={{
                position: 'fixed',
                top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10001
            }}
        >
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    background: 'white',
                    borderRadius: '12px',
                    padding: '28px',
                    maxWidth: '380px',
                    width: '90%',
                    textAlign: 'center',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                    fontFamily: 'Calibri, sans-serif',
                    borderTop: `4px solid ${config.color}`
                }}
            >
                <div style={{
                    fontSize: '42px',
                    width: '70px',
                    height: '70px',
                    margin: '0 auto 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%',
                    backgroundColor: config.bg
                }}>
                    {config.icon}
                </div>
                <h3 style={{
                    color: THEME.primaryDark,
                    marginBottom: '10px',
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    margin: '0 0 10px 0'
                }}>
                    {config.title}
                </h3>
                <p style={{
                    color: THEME.text,
                    marginBottom: '22px',
                    lineHeight: '1.5',
                    fontSize: '14px',
                    margin: '0 0 22px 0'
                }}>
                    {notification.message}
                </p>
                <button
                    onClick={closeNotification}
                    style={{
                        padding: '10px 32px',
                        borderRadius: '8px',
                        border: 'none',
                        backgroundColor: THEME.primary,
                        color: 'white',
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: '13px',
                        transition: 'background-color 0.2s ease'
                    }}
                    onMouseOver={e => e.target.style.backgroundColor = THEME.primaryDark}
                    onMouseOut={e => e.target.style.backgroundColor = THEME.primary}
                >
                    OK
                </button>
            </div>
        </div>
    ) : null;

    return { notification, showNotification, closeNotification, NotificationModal };
};

export default useNotification;
