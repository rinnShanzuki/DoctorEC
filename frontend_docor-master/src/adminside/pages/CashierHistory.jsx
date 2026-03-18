import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import '../pages/Dashboard.css';
import clinicLogo from '../../assets/logo.jpg';

const CashierHistory = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [transactionDetails, setTransactionDetails] = useState(null);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });

    useEffect(() => {
        fetchTransactions();
    }, [filter]);

    const fetchTransactions = async () => {
        try {
            setLoading(true);
            const response = await adminAPI.getTransactions(filter, searchTerm);
            const data = response.data?.data || response.data || {};
            setTransactions(data.transactions || []);
            setPagination(data.pagination || { current_page: 1, last_page: 1, total: 0 });
        } catch (error) {
            console.error('Error fetching transactions:', error);
            setTransactions([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchTransactions();
    };

    const handleViewDetails = async (transaction) => {
        setSelectedTransaction(transaction);
        setShowDetailsModal(true);
        setDetailsLoading(true);
        try {
            const response = await adminAPI.getTransaction(transaction.id);
            setTransactionDetails(response.data?.data || response.data);
        } catch (error) {
            console.error('Error fetching transaction details:', error);
        } finally {
            setDetailsLoading(false);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const formatCurrency = (amount) => {
        return `₱${parseFloat(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const printReceipt = () => {
        if (!transactionDetails) return;

        const allItems = [
            ...(transactionDetails.items || []),
            ...(transactionDetails.services || [])
        ];

        const transDate = new Date(transactionDetails.created_at);
        const dateStr = transDate.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
        const timeStr = transDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

        const printWindow = window.open('', '', 'width=400,height=700');
        printWindow.document.write(`
            <html>
            <head>
                <title>Receipt - Doctor EC Optical Clinic</title>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600&family=Source+Code+Pro:wght@400;500&display=swap');
                    
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { 
                        font-family: 'Source Code Pro', 'Courier New', monospace; 
                        width: 320px; 
                        padding: 25px 20px; 
                        margin: 0 auto; 
                        color: #333;
                        font-size: 12px;
                    }
                    .header { text-align: center; margin-bottom: 20px; }
                    .logo-container {
                        width: 70px;
                        height: 70px;
                        margin: 0 auto 10px;
                        border-radius: 50%;
                        overflow: hidden;
                        border: 2px solid #8B7355;
                    }
                    .logo-container img {
                        width: 100%;
                        height: 100%;
                        object-fit: cover;
                    }
                    .clinic-name { 
                        font-family: 'Playfair Display', Georgia, serif;
                        font-size: 22px; 
                        color: #5D4E37; 
                        letter-spacing: 3px;
                        margin-bottom: 5px;
                    }
                    .clinic-subtitle {
                        font-family: 'Playfair Display', Georgia, serif;
                        font-size: 13px;
                        color: #8B7355;
                        font-style: italic;
                        margin-bottom: 3px;
                    }
                    .clinic-address {
                        font-size: 11px;
                        color: #888;
                        line-height: 1.4;
                    }
                    
                    .info-section {
                        margin: 20px 0;
                        padding: 10px 0;
                        border-top: 1px solid #E0D5C7;
                    }
                    .info-row {
                        display: flex;
                        justify-content: space-between;
                        margin: 6px 0;
                        font-size: 12px;
                    }
                    .info-label { color: #8B7355; }
                    .info-value { color: #333; text-align: right; }
                    
                    .items-section {
                        margin: 20px 0;
                        padding-top: 15px;
                        border-top: 1px solid #E0D5C7;
                    }
                    .items-header {
                        font-weight: 600;
                        color: #5D4E37;
                        margin-bottom: 15px;
                        font-size: 13px;
                    }
                    .item {
                        margin-bottom: 15px;
                    }
                    .item-name {
                        font-weight: 500;
                        color: #333;
                        margin-bottom: 3px;
                    }
                    .service-tag {
                        display: inline-block;
                        background: #E3F2FD;
                        color: #1976D2;
                        font-size: 9px;
                        padding: 2px 6px;
                        border-radius: 3px;
                        margin-left: 5px;
                        text-decoration: underline;
                    }
                    .item-calc {
                        display: flex;
                        justify-content: space-between;
                        color: #666;
                        font-size: 11px;
                    }
                    
                    .total-section {
                        margin: 25px 0;
                        padding: 15px 0;
                        border-top: 2px solid #5D4E37;
                        border-bottom: 1px solid #E0D5C7;
                    }
                    .total-row {
                        display: flex;
                        justify-content: space-between;
                        font-size: 18px;
                        font-weight: 600;
                    }
                    .total-label { color: #333; }
                    .total-value { color: #5D4E37; }
                    
                    .payment-section {
                        margin: 15px 0;
                    }
                    .payment-row {
                        display: flex;
                        justify-content: space-between;
                        margin: 6px 0;
                        font-size: 12px;
                    }
                    .payment-label { color: #666; }
                    .change-row .payment-label { color: #8B7355; }
                    .change-row .payment-value { color: #8B7355; }
                    
                    .footer {
                        text-align: center;
                        margin-top: 25px;
                        padding-top: 15px;
                        border-top: 1px solid #E0D5C7;
                    }
                    .thank-you {
                        font-family: 'Playfair Display', Georgia, serif;
                        font-style: italic;
                        color: #8B7355;
                        font-size: 12px;
                        line-height: 1.5;
                    }
                    .official {
                        font-size: 10px;
                        color: #aaa;
                        margin-top: 8px;
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="logo-container">
                        <img src="${window.location.origin}/src/assets/logo.jpg" alt="Logo" onerror="this.parentElement.innerHTML='👁️'" />
                    </div>
                    <div class="clinic-name">DOCTOR EC</div>
                    <div class="clinic-subtitle">Optical Clinic</div>
                    <div class="clinic-address">
                        Vision Street, Eye City<br>
                        Tel: (123) 456-7890
                    </div>
                </div>
                
                <div class="info-section">
                    <div class="info-row">
                        <span class="info-label">Receipt #:</span>
                        <span class="info-value">${transactionDetails.receipt_number}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Date:</span>
                        <span class="info-value">${dateStr}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Time:</span>
                        <span class="info-value">${timeStr}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Cashier:</span>
                        <span class="info-value">Admin</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Customer:</span>
                        <span class="info-value">${transactionDetails.customer_name}</span>
                    </div>
                </div>
                
                <div class="items-section">
                    <div class="items-header">Items:</div>
                    ${allItems.map(item => `
                        <div class="item">
                            <div class="item-name">
                                ${item.name}
                                ${item.type === 'service' ? '<span class="service-tag">SERVICE</span>' : ''}
                            </div>
                            <div class="item-calc">
                                <span>${item.quantity || item.sessions} x ${formatCurrency(item.unit_price)}</span>
                                <span>${formatCurrency(item.subtotal)}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <div class="total-section">
                    <div class="total-row">
                        <span class="total-label">TOTAL</span>
                        <span class="total-value">${formatCurrency(transactionDetails.total_amount)}</span>
                    </div>
                </div>
                
                <div class="payment-section">
                    <div class="payment-row">
                        <span class="payment-label">Payment Method:</span>
                        <span class="payment-value">${transactionDetails.payment_method}</span>
                    </div>
                    <div class="payment-row">
                        <span class="payment-label">Amount Tendered:</span>
                        <span class="payment-value">${formatCurrency(transactionDetails.amount_tendered)}</span>
                    </div>
                    <div class="payment-row change-row">
                        <span class="payment-label">Change:</span>
                        <span class="payment-value">${formatCurrency(transactionDetails.change_amount)}</span>
                    </div>
                </div>
                
                <div class="footer">
                    <div class="thank-you">
                        Thank you for choosing Doctor EC! We<br>
                        care for your vision. 👁️
                    </div>
                    <div class="official">*** This is your official receipt ***</div>
                </div>
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    };

    return (
        <div style={{ padding: '20px' }}>
            {/* Header */}
            <div style={{ marginBottom: '20px' }}>
                <h1 style={{ color: '#5D4E37', margin: 0 }}>Transaction History</h1>
                <p style={{ color: '#8B7355' }}>View and manage past sales transactions</p>
            </div>

            {/* Filters and Search */}
            <div style={{
                display: 'flex',
                gap: '15px',
                marginBottom: '20px',
                flexWrap: 'wrap',
                alignItems: 'center'
            }}>
                {/* Date Filters */}
                <div style={{ display: 'flex', gap: '5px' }}>
                    {['all', 'day', 'week', 'month'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            style={{
                                padding: '8px 16px',
                                border: filter === f ? 'none' : '1px solid #E0D5C7',
                                borderRadius: '20px',
                                background: filter === f ? '#5D4E37' : 'white',
                                color: filter === f ? 'white' : '#5D4E37',
                                cursor: 'pointer',
                                fontWeight: '500',
                                textTransform: 'capitalize'
                            }}
                        >
                            {f === 'all' ? 'All Time' : `This ${f.charAt(0).toUpperCase() + f.slice(1)}`}
                        </button>
                    ))}
                </div>

                {/* Search */}
                <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px', flex: 1, maxWidth: '400px' }}>
                    <input
                        type="text"
                        placeholder="Search by receipt # or customer name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            flex: 1,
                            padding: '10px 15px',
                            border: '1px solid #E0D5C7',
                            borderRadius: '8px',
                            fontSize: '14px'
                        }}
                    />
                    <button
                        type="submit"
                        style={{
                            padding: '10px 20px',
                            background: '#5D4E37',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer'
                        }}
                    >
                        🔍 Search
                    </button>
                </form>
            </div>

            {/* Transactions Table */}
            <div style={{
                background: 'white',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                overflow: 'hidden'
            }}>
                {loading ? (
                    <div style={{ padding: '40px', textAlign: 'center' }}>
                        <div className="spinner" style={{ margin: '0 auto 10px' }}></div>
                        <p>Loading transactions...</p>
                    </div>
                ) : transactions.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>
                        <p style={{ fontSize: '40px', marginBottom: '10px' }}>📭</p>
                        <p>No transactions found</p>
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#F5F1EE' }}>
                                <th style={{ padding: '15px', textAlign: 'left', color: '#5D4E37' }}>Receipt #</th>
                                <th style={{ padding: '15px', textAlign: 'left', color: '#5D4E37' }}>Customer</th>
                                <th style={{ padding: '15px', textAlign: 'left', color: '#5D4E37' }}>Date</th>
                                <th style={{ padding: '15px', textAlign: 'right', color: '#5D4E37' }}>Total</th>
                                <th style={{ padding: '15px', textAlign: 'center', color: '#5D4E37' }}>Payment</th>
                                <th style={{ padding: '15px', textAlign: 'center', color: '#5D4E37' }}>Items</th>
                                <th style={{ padding: '15px', textAlign: 'center', color: '#5D4E37' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.map(transaction => (
                                <tr key={transaction.id} style={{ borderBottom: '1px solid #E0D5C7' }}>
                                    <td style={{ padding: '15px', fontWeight: '600' }}>{transaction.receipt_number}</td>
                                    <td style={{ padding: '15px' }}>{transaction.customer_name}</td>
                                    <td style={{ padding: '15px', color: '#666' }}>{formatDate(transaction.created_at)}</td>
                                    <td style={{ padding: '15px', textAlign: 'right', fontWeight: '600', color: '#2E7D32' }}>
                                        {formatCurrency(transaction.total_amount)}
                                    </td>
                                    <td style={{ padding: '15px', textAlign: 'center' }}>
                                        <span style={{
                                            padding: '4px 10px',
                                            borderRadius: '12px',
                                            fontSize: '12px',
                                            fontWeight: '500',
                                            background: transaction.payment_method === 'Cash' ? '#E8F5E9' : '#E3F2FD',
                                            color: transaction.payment_method === 'Cash' ? '#2E7D32' : '#1976D2'
                                        }}>
                                            {transaction.payment_method}
                                        </span>
                                    </td>
                                    <td style={{ padding: '15px', textAlign: 'center' }}>
                                        <span style={{ color: '#666' }}>
                                            {transaction.items_count + transaction.services_count}
                                        </span>
                                    </td>
                                    <td style={{ padding: '15px', textAlign: 'center' }}>
                                        <button
                                            onClick={() => handleViewDetails(transaction)}
                                            style={{
                                                padding: '6px 12px',
                                                background: '#5D4E37',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                fontSize: '12px'
                                            }}
                                        >
                                            View Details
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {/* Pagination */}
                {pagination.total > 0 && (
                    <div style={{
                        padding: '15px',
                        borderTop: '1px solid #E0D5C7',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <span style={{ color: '#666', fontSize: '14px' }}>
                            Showing {transactions.length} of {pagination.total} transactions
                        </span>
                        <span style={{ color: '#666', fontSize: '14px' }}>
                            Page {pagination.current_page} of {pagination.last_page}
                        </span>
                    </div>
                )}
            </div>

            {/* Transaction Details Modal */}
            {showDetailsModal && (
                <div
                    className="modal-overlay"
                    onClick={() => setShowDetailsModal(false)}
                    style={{
                        position: 'fixed',
                        top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 10000
                    }}
                >
                    <div
                        className="modal-content"
                        onClick={e => e.stopPropagation()}
                        style={{
                            background: 'white',
                            borderRadius: '16px',
                            padding: '25px',
                            maxWidth: '550px',
                            width: '90%',
                            maxHeight: '90vh',
                            overflowY: 'auto'
                        }}
                    >
                        {detailsLoading ? (
                            <div style={{ padding: '40px', textAlign: 'center' }}>
                                <div className="spinner" style={{ margin: '0 auto 10px' }}></div>
                                <p>Loading details...</p>
                            </div>
                        ) : transactionDetails ? (
                            <>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                    <h2 style={{ margin: 0, color: '#5D4E37' }}>Transaction Details</h2>
                                    <button
                                        onClick={() => setShowDetailsModal(false)}
                                        style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}
                                    >
                                        ×
                                    </button>
                                </div>

                                {/* Receipt Header */}
                                <div style={{
                                    background: '#F5F1EE',
                                    padding: '15px',
                                    borderRadius: '8px',
                                    marginBottom: '20px',
                                    textAlign: 'center'
                                }}>
                                    <img src={clinicLogo} alt="Logo" style={{ width: '60px', height: '60px', borderRadius: '50%', marginBottom: '10px' }} />
                                    <h3 style={{ margin: '0 0 5px', color: '#5D4E37' }}>Doctor EC Optical Clinic</h3>
                                    <p style={{ margin: 0, color: '#888', fontSize: '13px' }}>Receipt #{transactionDetails.receipt_number}</p>
                                </div>

                                {/* Transaction Info */}
                                <div style={{ marginBottom: '20px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <span style={{ color: '#888' }}>Customer:</span>
                                        <span style={{ fontWeight: '600' }}>{transactionDetails.customer_name}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <span style={{ color: '#888' }}>Date:</span>
                                        <span>{formatDate(transactionDetails.created_at)}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: '#888' }}>Payment Method:</span>
                                        <span>{transactionDetails.payment_method}</span>
                                    </div>
                                </div>

                                {/* Items */}
                                <h4 style={{ color: '#5D4E37', marginBottom: '10px', borderBottom: '1px solid #E0D5C7', paddingBottom: '8px' }}>
                                    Items & Services
                                </h4>
                                <div style={{ marginBottom: '20px' }}>
                                    {transactionDetails.items?.map((item, idx) => (
                                        <div key={`item-${idx}`} style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            padding: '8px 0',
                                            borderBottom: '1px dotted #E0D5C7'
                                        }}>
                                            <div>
                                                <span>{item.name}</span>
                                                <span style={{ color: '#888', fontSize: '12px', marginLeft: '8px' }}>
                                                    × {item.quantity}
                                                </span>
                                            </div>
                                            <span style={{ fontWeight: '500' }}>{formatCurrency(item.subtotal)}</span>
                                        </div>
                                    ))}
                                    {transactionDetails.services?.map((service, idx) => (
                                        <div key={`service-${idx}`} style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            padding: '8px 0',
                                            borderBottom: '1px dotted #E0D5C7'
                                        }}>
                                            <div>
                                                <span>{service.name}</span>
                                                <span style={{
                                                    background: '#E3F2FD',
                                                    color: '#1976D2',
                                                    padding: '2px 6px',
                                                    borderRadius: '4px',
                                                    fontSize: '10px',
                                                    marginLeft: '8px'
                                                }}>SERVICE</span>
                                                <span style={{ color: '#888', fontSize: '12px', marginLeft: '8px' }}>
                                                    × {service.sessions} session(s)
                                                </span>
                                            </div>
                                            <span style={{ fontWeight: '500' }}>{formatCurrency(service.subtotal)}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Totals */}
                                <div style={{
                                    background: '#F5F1EE',
                                    padding: '15px',
                                    borderRadius: '8px',
                                    marginBottom: '20px'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '18px', fontWeight: '700' }}>
                                        <span>Total:</span>
                                        <span style={{ color: '#2E7D32' }}>{formatCurrency(transactionDetails.total_amount)}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <span style={{ color: '#666' }}>Amount Tendered:</span>
                                        <span>{formatCurrency(transactionDetails.amount_tendered)}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: '#666' }}>Change:</span>
                                        <span>{formatCurrency(transactionDetails.change_amount)}</span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button
                                        onClick={printReceipt}
                                        style={{
                                            flex: 1,
                                            padding: '12px',
                                            background: '#5D4E37',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            fontWeight: '600'
                                        }}
                                    >
                                        🖨️ Print Receipt
                                    </button>
                                    <button
                                        onClick={() => setShowDetailsModal(false)}
                                        style={{
                                            flex: 1,
                                            padding: '12px',
                                            background: '#E0D5C7',
                                            color: '#5D4E37',
                                            border: 'none',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            fontWeight: '600'
                                        }}
                                    >
                                        Close
                                    </button>
                                </div>
                            </>
                        ) : (
                            <p>Failed to load transaction details</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CashierHistory;
