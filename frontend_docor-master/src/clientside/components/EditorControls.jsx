import React from 'react';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { FaSave, FaUndo, FaRedo } from 'react-icons/fa';

const EditorControls = () => {
    const { isEditing, undo, redo, saveSettings, canUndo, canRedo, hasUnsavedChanges } = useSiteSettings();

    if (!isEditing) return null;

    return (
        <div style={styles.container}>
            <div style={styles.group}>
                <button
                    onClick={undo}
                    disabled={!canUndo}
                    style={{ ...styles.button, opacity: !canUndo ? 0.5 : 1 }}
                    title="Undo"
                >
                    <FaUndo />
                </button>
                <button
                    onClick={redo}
                    disabled={!canRedo}
                    style={{ ...styles.button, opacity: !canRedo ? 0.5 : 1 }}
                    title="Redo"
                >
                    <FaRedo />
                </button>
            </div>

            <button
                onClick={saveSettings}
                disabled={!hasUnsavedChanges}
                style={{
                    ...styles.saveButton,
                    backgroundColor: hasUnsavedChanges ? '#2e7d32' : '#ccc',
                    cursor: hasUnsavedChanges ? 'pointer' : 'default'
                }}
                title="Save Changes"
            >
                <FaSave style={{ marginRight: '8px' }} />
                Save Changes
            </button>
        </div>
    );
};

const styles = {
    container: {
        position: 'fixed',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: 'white',
        padding: '10px 20px',
        borderRadius: '50px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        zIndex: 9999,
        border: '1px solid #e0e0e0'
    },
    group: {
        display: 'flex',
        gap: '10px',
        borderRight: '1px solid #e0e0e0',
        paddingRight: '20px'
    },
    button: {
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        fontSize: '18px',
        color: '#555',
        padding: '8px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background-color 0.2s'
    },
    saveButton: {
        border: 'none',
        color: 'white',
        padding: '10px 20px',
        borderRadius: '25px',
        fontSize: '14px',
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        transition: 'background-color 0.3s'
    }
};

export default EditorControls;
