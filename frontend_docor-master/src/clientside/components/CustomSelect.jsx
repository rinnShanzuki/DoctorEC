import React, { useState, useRef, useEffect } from 'react';
import { FaChevronDown } from 'react-icons/fa';

const CustomSelect = ({ value, onChange, options, placeholder, name, required }) => {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef(null);

    // Close when clicking outside
    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setIsOpen(false);
        };
        document.addEventListener('mousedown', handler);
        document.addEventListener('touchstart', handler);
        return () => {
            document.removeEventListener('mousedown', handler);
            document.removeEventListener('touchstart', handler);
        };
    }, []);

    const selectedOption = options.find(o => String(o.value) === String(value));
    const displayText = selectedOption ? selectedOption.label : placeholder || 'Select...';

    const handleSelect = (val) => {
        onChange({ target: { name, value: val } });
        setIsOpen(false);
    };

    return (
        <div ref={ref} style={styles.wrapper}>
            {/* Hidden native input for form validation */}
            {required && <input type="hidden" name={name} value={value} required />}

            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    ...styles.trigger,
                    ...(isOpen ? styles.triggerOpen : {}),
                    color: selectedOption ? '#3E2723' : '#999',
                }}
            >
                <span style={styles.triggerText}>{displayText}</span>
                <FaChevronDown style={{
                    ...styles.arrow,
                    transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                }} />
            </button>

            {isOpen && (
                <div style={styles.dropdown}>
                    {options.map((opt) => (
                        <button
                            key={opt.value}
                            type="button"
                            onClick={() => handleSelect(opt.value)}
                            style={{
                                ...styles.option,
                                ...(String(value) === String(opt.value) ? styles.optionSelected : {}),
                            }}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

const styles = {
    wrapper: {
        position: 'relative',
        width: '100%',
    },
    trigger: {
        width: '100%',
        padding: '12px 40px 12px 12px',
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: '#D7CCC8',
        borderRadius: '8px',
        backgroundColor: 'white',
        fontFamily: 'var(--font-body-inter)',
        fontSize: '1rem',
        textAlign: 'left',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        transition: 'border-color 0.2s',
    },
    triggerOpen: {
        borderColor: '#8D6E63',
        boxShadow: '0 0 0 2px rgba(141, 110, 99, 0.15)',
    },
    triggerText: {
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        flex: 1,
    },
    arrow: {
        fontSize: '0.75rem',
        color: '#8B7355',
        transition: 'transform 0.2s',
        flexShrink: 0,
    },
    dropdown: {
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        marginTop: '4px',
        backgroundColor: 'white',
        border: '1px solid #D7CCC8',
        borderRadius: '8px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        zIndex: 100,
        maxHeight: '200px',
        overflowY: 'auto',
    },
    option: {
        width: '100%',
        padding: '12px 14px',
        border: 'none',
        backgroundColor: 'transparent',
        fontFamily: 'var(--font-body-inter)',
        fontSize: '0.95rem',
        color: '#3E2723',
        textAlign: 'left',
        cursor: 'pointer',
        transition: 'background-color 0.15s',
        display: 'block',
    },
    optionSelected: {
        backgroundColor: '#F5F1EE',
        fontWeight: '600',
        color: '#5D4E37',
    },
};

export default CustomSelect;
