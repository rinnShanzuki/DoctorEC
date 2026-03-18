import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBell } from 'react-icons/fa';
import { adminAPI } from '../../services/api';

const POLL_INTERVAL = 60000; // 60 seconds

const NotificationBell = () => {
    const [alerts, setAlerts] = useState([]);
    const [summary, setSummary] = useState({ low_stock_count: 0, out_of_stock_count: 0, total_alerts: 0 });
    const [isOpen, setIsOpen] = useState(false);
    const [dismissed, setDismissed] = useState(() => {
        try {
            return JSON.parse(sessionStorage.getItem('dismissed_stock_alerts') || '[]');
        } catch { return []; }
    });
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    const fetchAlerts = useCallback(async () => {
        try {
            const { data: response } = await adminAPI.getLowStockAlerts();
            const data = response.data || response;
            const allAlerts = data.alerts || [];
            const summaryData = data.summary || { low_stock_count: 0, out_of_stock_count: 0, total_alerts: 0 };

            // Filter out dismissed alerts
            const activeAlerts = allAlerts.filter(a => !dismissed.includes(a.product_id));
            setAlerts(activeAlerts);
            setSummary({ ...summaryData, total_alerts: activeAlerts.length });
        } catch (error) {
            console.error('Error fetching low stock alerts:', error);
        }
    }, [dismissed]);

    useEffect(() => {
        fetchAlerts();
        const interval = setInterval(fetchAlerts, POLL_INTERVAL);
        return () => clearInterval(interval);
    }, [fetchAlerts]);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleDismissAll = () => {
        const ids = alerts.map(a => a.product_id);
        const newDismissed = [...dismissed, ...ids];
        setDismissed(newDismissed);
        sessionStorage.setItem('dismissed_stock_alerts', JSON.stringify(newDismissed));
        setAlerts([]);
        setSummary(prev => ({ ...prev, total_alerts: 0 }));
        setIsOpen(false);
    };

    const handleGoToInventory = () => {
        setIsOpen(false);
        navigate('/admin/dashboard/inventory');
    };

    const badgeCount = summary.total_alerts;

    return (
        <div ref={dropdownRef} style={{ position: 'relative' }}>
            {/* Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={styles.bellButton}
                title="Stock Alerts"
            >
                <FaBell />
                {badgeCount > 0 && (
                    <span style={styles.badge}>
                        {badgeCount > 99 ? '99+' : badgeCount}
                    </span>
                )}
            </button>

            {/* Dropdown Panel */}
            {isOpen && (
                <div style={styles.dropdown}>
                    {/* Header */}
                    <div style={styles.dropdownHeader}>
                        <span style={{ fontWeight: 700, color: '#3E2723', fontSize: '14px' }}>
                            Stock Alerts
                        </span>
                        <span style={styles.headerBadge}>
                            {badgeCount} alert{badgeCount !== 1 ? 's' : ''}
                        </span>
                    </div>

                    {/* Alert List */}
                    <div style={styles.alertList}>
                        {alerts.length === 0 ? (
                            <div style={styles.emptyState}>
                                <span style={{ fontSize: '32px' }}>✅</span>
                                <p style={{ margin: '8px 0 0', color: '#888', fontSize: '13px' }}>All stock levels are healthy!</p>
                            </div>
                        ) : (
                            alerts.map((alert) => (
                                <div
                                    key={alert.product_id}
                                    style={{
                                        ...styles.alertItem,
                                        borderLeft: `3px solid ${alert.alert_type === 'out_of_stock' ? '#c62828' : '#ef6c00'}`,
                                    }}
                                >
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 600, fontSize: '13px', color: '#3E2723', marginBottom: '2px' }}>
                                            {alert.name}
                                        </div>
                                        <div style={{ fontSize: '11px', color: '#888' }}>
                                            {alert.category || 'Uncategorized'}
                                        </div>
                                    </div>
                                    <div style={{
                                        ...styles.stockBadge,
                                        backgroundColor: alert.alert_type === 'out_of_stock' ? '#ffebee' : '#fff3e0',
                                        color: alert.alert_type === 'out_of_stock' ? '#c62828' : '#ef6c00',
                                    }}>
                                        {alert.alert_type === 'out_of_stock' ? 'Out of Stock' : `${alert.stock} left`}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer Actions */}
                    {alerts.length > 0 && (
                        <div style={styles.dropdownFooter}>
                            <button onClick={handleDismissAll} style={styles.dismissBtn}>
                                Dismiss All
                            </button>
                            <button onClick={handleGoToInventory} style={styles.viewBtn}>
                                View Inventory
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const styles = {
    bellButton: {
        background: 'rgba(255,255,255,0.15)',
        border: 'none',
        color: 'white',
        fontSize: '18px',
        cursor: 'pointer',
        padding: '8px 12px',
        borderRadius: '8px',
        position: 'relative',
        transition: 'background 0.2s',
        display: 'flex',
        alignItems: 'center',
    },
    badge: {
        position: 'absolute',
        top: '2px',
        right: '2px',
        backgroundColor: '#c62828',
        color: 'white',
        fontSize: '10px',
        fontWeight: 700,
        borderRadius: '10px',
        padding: '1px 5px',
        minWidth: '16px',
        textAlign: 'center',
        lineHeight: '14px',
    },
    dropdown: {
        position: 'absolute',
        top: '100%',
        right: 0,
        marginTop: '8px',
        width: '340px',
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
        zIndex: 10002,
        overflow: 'hidden',
        fontFamily: 'Calibri, sans-serif',
    },
    dropdownHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '14px 16px',
        borderBottom: '1px solid #f0ebe5',
        backgroundColor: '#faf8f5',
    },
    headerBadge: {
        fontSize: '11px',
        fontWeight: 600,
        color: '#ef6c00',
        backgroundColor: '#fff3e0',
        padding: '2px 8px',
        borderRadius: '10px',
    },
    alertList: {
        maxHeight: '300px',
        overflowY: 'auto',
    },
    emptyState: {
        textAlign: 'center',
        padding: '30px 16px',
    },
    alertItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '10px 16px',
        borderBottom: '1px solid #f5f0eb',
        transition: 'background 0.15s',
    },
    stockBadge: {
        fontSize: '11px',
        fontWeight: 700,
        padding: '3px 8px',
        borderRadius: '6px',
        whiteSpace: 'nowrap',
    },
    dropdownFooter: {
        display: 'flex',
        gap: '8px',
        padding: '12px 16px',
        borderTop: '1px solid #f0ebe5',
        backgroundColor: '#faf8f5',
    },
    dismissBtn: {
        flex: 1,
        padding: '8px',
        border: '1px solid #ddd',
        backgroundColor: 'white',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '12px',
        fontWeight: 600,
        color: '#666',
    },
    viewBtn: {
        flex: 1,
        padding: '8px',
        border: 'none',
        backgroundColor: '#5D4E37',
        color: 'white',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '12px',
        fontWeight: 600,
    },
};

export default NotificationBell;
