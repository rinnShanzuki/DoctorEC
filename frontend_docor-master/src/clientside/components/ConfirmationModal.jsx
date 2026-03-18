import React from 'react';

const ConfirmationModal = ({ isOpen, onClose, onConfirm, message, title = "Confirmation" }) => {
    if (!isOpen) return null;

    return (
        <div style={styles.overlay}>
            <div style={styles.modal}>
                <h3 style={styles.title}>{title}</h3>
                <p style={styles.message}>{message}</p>
                <div style={styles.buttonGroup}>
                    <button style={styles.cancelBtn} onClick={onClose}>
                        Cancel
                    </button>
                    <button style={styles.confirmBtn} onClick={onConfirm}>
                        OK
                    </button>
                </div>
            </div>
        </div>
    );
};

const styles = {
    overlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        animation: 'fadeIn 0.2s ease',
    },
    modal: {
        backgroundColor: 'var(--color-cream-white)',
        borderRadius: '12px',
        padding: '30px',
        maxWidth: '400px',
        width: '90%',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
        animation: 'slideDown 0.3s ease',
        textAlign: 'center',
    },
    title: {
        fontFamily: 'var(--font-heading-poppins)',
        fontSize: '1.5rem',
        color: 'var(--color-dark-brown)',
        marginBottom: '15px',
        margin: '0 0 15px 0',
    },
    message: {
        fontFamily: 'var(--font-body-inter)',
        fontSize: '1rem',
        color: 'var(--color-text-secondary)',
        marginBottom: '25px',
        lineHeight: '1.5',
    },
    buttonGroup: {
        display: 'flex',
        gap: '15px',
        justifyContent: 'center',
    },
    cancelBtn: {
        flex: 1,
        padding: '12px 24px',
        fontSize: '0.95rem',
        fontWeight: '600',
        fontFamily: 'var(--font-body-inter)',
        border: '2px solid var(--color-dark-brown)',
        backgroundColor: 'transparent',
        color: 'var(--color-dark-brown)',
        borderRadius: 'var(--border-radius)',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
    },
    confirmBtn: {
        flex: 1,
        padding: '12px 24px',
        fontSize: '0.95rem',
        fontWeight: '600',
        fontFamily: 'var(--font-body-inter)',
        border: 'none',
        backgroundColor: 'var(--color-dark-brown)',
        color: 'var(--color-white)',
        borderRadius: 'var(--border-radius)',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
    },
};

export default ConfirmationModal;
