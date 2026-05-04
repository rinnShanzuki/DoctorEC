import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import '../pages/Dashboard.css';
import productImages from '../../clientside/data/productImages';
import clinicLogo from '../../assets/logo.jpg';

const CashierPOS = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const notificationRef = useRef(null);

    // Data states
    const [products, setProducts] = useState([]);
    const [services, setServices] = useState([]);
    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(false);

    // Click outside handler for notifications dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setShowNotificationsDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // UI states
    const [activeTab, setActiveTab] = useState('products');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    // Payment states
    const [paymentMethod, setPaymentMethod] = useState('Cash');
    const [amountTendered, setAmountTendered] = useState('');
    
    // Customer Selection States
    const [customers, setCustomers] = useState([]);
    const [customerSearchTerm, setCustomerSearchTerm] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
    
    // New Customer Modal States
    const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);
    const [newCustomerForm, setNewCustomerForm] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
    });
    const [creatingCustomer, setCreatingCustomer] = useState(false);

    // Modal states
    const [showReceipt, setShowReceipt] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [receiptData, setReceiptData] = useState(null);
    const [processing, setProcessing] = useState(false);

    // Notification modal state
    const [notification, setNotification] = useState({ show: false, message: '', type: 'info' });

    // POS Notifications (from doctors)
    const [posNotifications, setPosNotifications] = useState([]);
    const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);

    const showNotification = (message, type = 'info') => {
        setNotification({ show: true, message, type });
    };

    const closeNotification = () => {
        setNotification({ show: false, message: '', type: 'info' });
    };

    // GCash QR from database
    const [gcashQrUrl, setGcashQrUrl] = useState(null);

    // Fetch GCash QR from database
    useEffect(() => {
        const fetchGcashQr = async () => {
            try {
                const response = await adminAPI.getGcashQr();
                const data = response.data?.data;
                if (data?.qr_img) {
                    setGcashQrUrl(data.qr_img);
                }
            } catch (error) {
                console.error('Error fetching GCash QR:', error);
            }
        };
        fetchGcashQr();
    }, []);

    // Fetch data on mount
    useEffect(() => {
        fetchProducts();
        fetchServices();
        fetchCustomers();
        fetchPosNotifications();
        
        // Poll for notifications every 30 seconds
        const pollInterval = setInterval(fetchPosNotifications, 30000);
        return () => clearInterval(pollInterval);
    }, []);

    const fetchPosNotifications = async () => {
        try {
            console.log('fetchPosNotifications called...');
            const response = await adminAPI.getPosNotifications();
            console.log('fetchPosNotifications response:', response.data);
            setPosNotifications(response.data?.data || []);
        } catch (error) {
            console.error('Error fetching POS notifications:', error);
        }
    };

    const handleNotificationClick = async (notif) => {
        try {
            // Mark as read in backend
            await adminAPI.markPosNotificationAsRead(notif.id);
            // Remove from local state
            setPosNotifications(prev => prev.filter(n => n.id !== notif.id));
            setShowNotificationsDropdown(false);

            // Auto-populate patient and service if appointment is attached
            if (notif.appointment) {
                const appt = notif.appointment;
                
                // 1. Set Customer
                let custName = '';
                if (appt.patient) custName = `${appt.patient.first_name} ${appt.patient.last_name}`;
                else if (appt.client_account) custName = `${appt.client_account.first_name} ${appt.client_account.last_name}`; // Adjusted for standard snake_case sometimes returned
                else if (appt.clientAccount) custName = `${appt.clientAccount.first_name} ${appt.clientAccount.last_name}`; // Exact casing match check
                
                if (custName) {
                    setCustomerSearchTerm(custName);
                    if (customers.length > 0) {
                        const match = customers.find(c => 
                            c.name?.toLowerCase() === custName.toLowerCase() ||
                            `${c.first_name} ${c.last_name}`.toLowerCase() === custName.toLowerCase()
                        );
                        if (match) setSelectedCustomer(match);
                    }
                }

                // 2. Set Service and Add to Cart
                if (appt.service) {
                    setActiveTab('services');
                    const matchedService = services.find(s => s.service_id === appt.service_id);
                    if (matchedService && !cart.some(c => c.isService && c.service_id === matchedService.service_id)) {
                        addToCart(matchedService, true);
                    }
                }
            }
        } catch (error) {
            console.error('Error handling notification click:', error);
            showNotification('Failed to process notification', 'error');
        }
    };

    const fetchCustomers = async () => {
        try {
            const response = await adminAPI.getCustomers();
            const data = response.data?.data || response.data || [];
            setCustomers(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching customers:', error);
            setCustomers([]);
        }
    };

    // Read URL params from appointment payment flow
    const [searchParams] = useSearchParams();
    const [productRequired, setProductRequired] = useState(false);
    useEffect(() => {
        const appointmentCustomer = searchParams.get('customer');
        const appointmentService = searchParams.get('service');
        const appointmentProductRequired = searchParams.get('product_required');

        if (appointmentCustomer) {
            setCustomerSearchTerm(appointmentCustomer);
            // We will try to auto-match this when customers load
        }
        if (appointmentProductRequired === '1') {
            setProductRequired(true);
            setActiveTab('products');
        } else if (appointmentService) {
            setActiveTab('services');
        }
        if (appointmentService) {
            // Auto-add the service to cart after services load
            const timer = setTimeout(() => {
                const matchedService = services.find(s =>
                    s.name?.toLowerCase() === appointmentService.toLowerCase()
                );
                if (matchedService && !cart.some(c => c.isService && c.service_id === matchedService.service_id)) {
                    addToCart(matchedService, true);
                }
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [searchParams, services]);

    // Attempt to auto-select customer once customers are loaded and URL param is set
    useEffect(() => {
        const appointmentCustomer = searchParams.get('customer');
        if (appointmentCustomer && customers.length > 0 && !selectedCustomer) {
            const match = customers.find(c => 
                c.name?.toLowerCase() === appointmentCustomer.toLowerCase() ||
                `${c.first_name} ${c.last_name}`.toLowerCase() === appointmentCustomer.toLowerCase()
            );
            if (match) {
                setSelectedCustomer(match);
                setCustomerSearchTerm(match.name || `${match.first_name} ${match.last_name}`);
            }
        }
    }, [searchParams, customers, selectedCustomer]);

    const fetchProducts = async () => {
        try {
            const response = await adminAPI.getProducts();
            const data = response.data?.data || response.data || [];
            setProducts(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching products:', error);
            setProducts([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchServices = async () => {
        try {
            const response = await adminAPI.getServicesWithStats();
            const data = response.data?.data || response.data || [];
            setServices(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching services:', error);
            setServices([]);
        }
    };

    // Filter products
    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    // Filter services
    const filteredServices = services.filter(s =>
        s.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Pagination
    const currentItems = activeTab === 'products'
        ? filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
        : filteredServices.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const totalPages = Math.ceil(
        (activeTab === 'products' ? filteredProducts.length : filteredServices.length) / itemsPerPage
    );

    // Get unique categories
    const categories = ['All', ...new Set(products.map(p => p.category).filter(Boolean))];

    // Get product image
    const getProductImage = (product) => {
        if (product.image) return product.image;
        const categoryImages = productImages[product.category];
        if (categoryImages?.length > 0) {
            return categoryImages[0];
        }
        return '/placeholder.png';
    };

    // Cart functions
    const addToCart = (item, isService = false) => {
        if (!isService && (item.stock || 0) <= 0) {
            showNotification('Out of stock!', 'error');
            return;
        }

        // Get the correct ID
        const productId = item.product_id || item.id;
        const serviceId = item.service_id || item.id;

        const cartId = isService ? `service-${serviceId}` : `product-${productId}`;
        const existingItem = cart.find(c => c.cartId === cartId);

        if (existingItem) {
            if (!isService && existingItem.quantity >= item.stock) {
                showNotification('Not enough stock!', 'warning');
                return;
            }
            setCart(cart.map(c =>
                c.cartId === cartId
                    ? { ...c, quantity: c.quantity + 1 }
                    : c
            ));
        } else {
            setCart([...cart, {
                cartId,
                product_id: isService ? null : productId,
                service_id: isService ? serviceId : null,
                name: item.name,
                price: parseFloat(item.price) || 0,
                quantity: 1,
                stock: isService ? 9999 : (item.stock || 0),
                isService
            }]);
        }
    };

    const updateQuantity = (cartId, delta) => {
        setCart(cart.map(item => {
            if (item.cartId === cartId) {
                const newQty = item.quantity + delta;
                if (newQty <= 0) return null;
                if (!item.isService && newQty > item.stock) {
                    showNotification('Not enough stock!', 'warning');
                    return item;
                }
                return { ...item, quantity: newQty };
            }
            return item;
        }).filter(Boolean));
    };

    const removeFromCart = (cartId) => {
        setCart(cart.filter(item => item.cartId !== cartId));
    };

    const handleCreateCustomer = async (e) => {
        e.preventDefault();
        setCreatingCustomer(true);
        try {
            const response = await adminAPI.createCustomer(newCustomerForm);
            const newCustomer = response.data?.data || response.data;
            
            // Add to customers list
            setCustomers([newCustomer, ...customers]);
            
            // Auto-select the new customer
            setSelectedCustomer(newCustomer);
            setCustomerSearchTerm(newCustomer.name || `${newCustomer.first_name} ${newCustomer.last_name}`);
            
            // Close modal and reset form
            setShowNewCustomerModal(false);
            setNewCustomerForm({ first_name: '', last_name: '', email: '', phone: '' });
            showNotification('Customer created successfully', 'success');
        } catch (error) {
            console.error('Error creating customer:', error);
            showNotification('Failed to create customer: ' + (error.response?.data?.message || error.message), 'error');
        } finally {
            setCreatingCustomer(false);
        }
    };

    const clearCart = () => {
        setCart([]);
        setSelectedCustomer(null);
        setCustomerSearchTerm('');
        setAmountTendered('');
    };

    const calculateTotal = () => {
        return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    };

    const calculateChange = () => {
        const tendered = parseFloat(amountTendered) || 0;
        return Math.max(0, tendered - calculateTotal());
    };

    // Payment process
    const handlePayment = () => {
        if (cart.length === 0) {
            showNotification('Cart is empty!', 'warning');
            return;
        }
        if (!selectedCustomer && !customerSearchTerm.trim()) {
            showNotification('Please select or enter a customer name!', 'warning');
            return;
        }
        if (paymentMethod === 'Cash') {
            const tendered = parseFloat(amountTendered) || 0;
            if (tendered < calculateTotal()) {
                showNotification('Insufficient payment amount!', 'error');
                return;
            }
        }
        setShowReceipt(true);
    };

    // Confirm and save transaction
    const confirmPayment = async () => {
        setProcessing(true);
        try {
            // Build items array
            const items = cart.map(item => ({
                product_id: item.isService ? null : item.product_id,
                service_id: item.isService ? item.service_id : null,
                quantity: item.quantity,
                price: item.price,
                is_service: item.isService === true
            }));

            const transactionData = {
                customer_id: selectedCustomer ? selectedCustomer.customer_id : null,
                customer_name: selectedCustomer ? (selectedCustomer.name || `${selectedCustomer.first_name} ${selectedCustomer.last_name}`) : customerSearchTerm.trim(),
                total_amount: calculateTotal(),
                payment_method: paymentMethod,
                amount_tendered: paymentMethod === 'Cash' ? parseFloat(amountTendered) : calculateTotal(),
                items
            };

            const response = await adminAPI.createTransaction(transactionData);
            setReceiptData(response.data?.data || response.data);

            // Refresh products to update stock
            fetchProducts();

            setShowReceipt(false);
            setShowSuccess(true);
        } catch (error) {
            console.error('Transaction failed:', error);
            showNotification('Transaction failed: ' + (error.response?.data?.message || error.message), 'error');
        } finally {
            setProcessing(false);
        }
    };

    // Close success and reset
    const handleSuccessClose = () => {
        setShowSuccess(false);
        clearCart();
        setReceiptData(null);
    };

    // Print receipt
    const printReceipt = () => {
        if (!receiptData) return;

        const now = new Date();
        const dateStr = now.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
        const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

        // Separate products and services
        const products = cart.filter(item => !item.isService);
        const services = cart.filter(item => item.isService);

        const printWindow = window.open('', '', 'width=400,height=700');
        printWindow.document.write(`
            <html>
            <head>
                <title>Receipt - Doctor EC</title>
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
                        <span class="info-value">${receiptData.receipt_number}</span>
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
                        <span class="info-value">${selectedCustomer ? (selectedCustomer.name || `${selectedCustomer.first_name} ${selectedCustomer.last_name}`) : customerSearchTerm || 'Walk-in'}</span>
                    </div>
                </div>
                
                <div class="items-section">
                    <div class="items-header">Items:</div>
                    ${cart.map(item => `
                        <div class="item">
                            <div class="item-name">
                                ${item.name}
                                ${item.isService ? '<span class="service-tag">SERVICE</span>' : ''}
                            </div>
                            <div class="item-calc">
                                <span>${item.quantity} x ₱${item.price.toLocaleString()}</span>
                                <span>₱${(item.price * item.quantity).toLocaleString()}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <div class="total-section">
                    <div class="total-row">
                        <span class="total-label">TOTAL</span>
                        <span class="total-value">₱${calculateTotal().toLocaleString()}</span>
                    </div>
                </div>
                
                <div class="payment-section">
                    <div class="payment-row">
                        <span class="payment-label">Payment Method:</span>
                        <span class="payment-value">${paymentMethod}</span>
                    </div>
                    <div class="payment-row">
                        <span class="payment-label">Amount Tendered:</span>
                        <span class="payment-value">₱${(parseFloat(amountTendered) || calculateTotal()).toLocaleString()}</span>
                    </div>
                    <div class="payment-row change-row">
                        <span class="payment-label">Change:</span>
                        <span class="payment-value">₱${calculateChange().toLocaleString()}</span>
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

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div style={{ padding: '20px', backgroundColor: '#F8F9FA', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* POS Header with Notifications */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ color: '#5D4E37', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '24px' }}>💳</span> Cashier POS
                </h2>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    {/* Notification Bell */}
                    <div ref={notificationRef} style={{ position: 'relative' }}>
                        <button
                            onClick={() => setShowNotificationsDropdown(!showNotificationsDropdown)}
                            style={{
                                background: 'white',
                                border: '1px solid #E0D5C7',
                                borderRadius: '50%',
                                width: '40px',
                                height: '40px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                fontSize: '18px',
                                position: 'relative',
                                boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
                            }}
                        >
                            🔔
                            {posNotifications.length > 0 && (
                                <span style={{
                                    position: 'absolute',
                                    top: '-5px',
                                    right: '-5px',
                                    background: '#ef4444',
                                    color: 'white',
                                    fontSize: '10px',
                                    fontWeight: 'bold',
                                    width: '18px',
                                    height: '18px',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: '2px solid white'
                                }}>
                                    {posNotifications.length}
                                </span>
                            )}
                        </button>

                        {/* Notifications Dropdown */}
                        {showNotificationsDropdown && (
                            <div style={{
                                position: 'absolute',
                                top: '100%',
                                right: 0,
                                marginTop: '10px',
                                width: '320px',
                                background: 'white',
                                borderRadius: '12px',
                                boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                                border: '1px solid #E0D5C7',
                                zIndex: 1000,
                                overflow: 'hidden'
                            }}>
                                <div style={{
                                    padding: '12px 15px',
                                    background: '#f8f9fa',
                                    borderBottom: '1px solid #eee',
                                    fontWeight: 'bold',
                                    color: '#5D4E37',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <span>Pending Payments</span>
                                    <span style={{ fontSize: '12px', background: '#E0D5C7', padding: '2px 8px', borderRadius: '10px' }}>
                                        {posNotifications.length}
                                    </span>
                                </div>
                                <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                                    {posNotifications.length > 0 ? (
                                        posNotifications.map(notif => (
                                            <div
                                                key={notif.id}
                                                onClick={() => handleNotificationClick(notif)}
                                                style={{
                                                    padding: '12px 15px',
                                                    borderBottom: '1px solid #f0f0f0',
                                                    cursor: 'pointer',
                                                    transition: 'background 0.2s',
                                                    display: 'flex',
                                                    gap: '12px',
                                                    alignItems: 'flex-start'
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.background = '#fcf8f2'}
                                                onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                                            >
                                                <div style={{
                                                    width: '32px', height: '32px', borderRadius: '50%',
                                                    background: '#E0D5C7', color: '#5D4E37',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontSize: '14px', flexShrink: 0
                                                }}>
                                                    ⚕️
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: '600', color: '#333', fontSize: '13px', marginBottom: '3px' }}>
                                                        {notif.message}
                                                    </div>
                                                    <div style={{ fontSize: '11px', color: '#888' }}>
                                                        {new Date(notif.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div style={{ padding: '30px 20px', textAlign: 'center', color: '#888', fontSize: '13px' }}>
                                            <div style={{ fontSize: '30px', marginBottom: '10px', opacity: 0.5 }}>✓</div>
                                            No pending payments
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Product Required Banner */}
            {productRequired && (
                <div style={{
                    padding: '14px 20px', marginBottom: '16px', borderRadius: '10px',
                    backgroundColor: '#FFF3E0', border: '2px solid #FFB74D',
                    display: 'flex', alignItems: 'center', gap: '12px',
                    fontSize: '14px', color: '#E65100', fontWeight: '600',
                    boxShadow: '0 2px 8px rgba(230, 81, 0, 0.12)'
                }}>
                    <span style={{ fontSize: '22px' }}>⚠️</span>
                    <span>Doctor prescribed product(s) for this patient. Please add the appropriate items below.</span>
                    <button
                        onClick={() => setProductRequired(false)}
                        style={{
                            marginLeft: 'auto', background: 'none', border: 'none',
                            cursor: 'pointer', color: '#E65100', fontSize: '18px', fontWeight: '700'
                        }}
                        title="Dismiss"
                    >
                        ×
                    </button>
                </div>
            )}

            <div style={{ display: 'flex', gap: '20px', height: 'calc(100vh - 120px)' }}>
                {/* Left Panel - Products/Services */}
                <div style={{
                    flex: 2,
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    padding: '20px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    {/* Tabs */}
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                        <button
                            onClick={() => { setActiveTab('products'); setCurrentPage(1); }}
                            style={{
                                padding: '10px 20px',
                                borderRadius: '20px',
                                border: 'none',
                                background: activeTab === 'products' ? '#5D4E37' : '#E0D5C7',
                                color: activeTab === 'products' ? 'white' : '#5D4E37',
                                fontWeight: 'bold',
                                cursor: 'pointer'
                            }}
                        >
                            Products
                        </button>
                        <button
                            onClick={() => { setActiveTab('services'); setCurrentPage(1); }}
                            style={{
                                padding: '10px 20px',
                                borderRadius: '20px',
                                border: 'none',
                                background: activeTab === 'services' ? '#5D4E37' : '#E0D5C7',
                                color: activeTab === 'services' ? 'white' : '#5D4E37',
                                fontWeight: 'bold',
                                cursor: 'pointer'
                            }}
                        >
                            Services
                        </button>
                    </div>

                    {/* Search and Filter */}
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                flex: 1,
                                padding: '12px',
                                borderRadius: '8px',
                                border: '1px solid #ddd',
                                fontSize: '14px'
                            }}
                        />
                        {activeTab === 'products' && (
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                style={{
                                    padding: '12px',
                                    borderRadius: '8px',
                                    border: '1px solid #ddd',
                                    minWidth: '150px'
                                }}
                            >
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        )}
                    </div>

                    {/* Items Grid */}
                    <div style={{
                        flex: 1,
                        overflowY: 'auto',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        gap: '12px',
                        padding: '5px'
                    }}>
                        {currentItems.map(item => (
                            <div
                                key={activeTab === 'products' ? item.product_id : item.service_id}
                                onClick={() => addToCart(item, activeTab === 'services')}
                                style={{
                                    backgroundColor: 'white',
                                    borderRadius: '10px',
                                    padding: '12px',
                                    cursor: 'pointer',
                                    boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
                                    transition: 'all 0.2s',
                                    border: '2px solid transparent',
                                    opacity: activeTab === 'products' && (item.stock || 0) <= 0 ? 0.5 : 1
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.borderColor = '#5D4E37'}
                                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'transparent'}
                            >
                                {activeTab === 'products' ? (
                                    <div style={{
                                        height: '80px',
                                        backgroundColor: '#f5f5f5',
                                        borderRadius: '6px',
                                        marginBottom: '8px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        overflow: 'hidden'
                                    }}>
                                        <img
                                            src={getProductImage(item)}
                                            alt={item.name}
                                            style={{ maxHeight: '70px', maxWidth: '100%', objectFit: 'contain' }}
                                            onError={(e) => e.target.style.display = 'none'}
                                        />
                                    </div>
                                ) : (
                                    <div style={{
                                        height: '80px',
                                        backgroundColor: '#e3f2fd',
                                        borderRadius: '6px',
                                        marginBottom: '8px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '32px'
                                    }}>
                                        🏥
                                    </div>
                                )}
                                <h4 style={{ fontSize: '12px', margin: '0 0 5px', color: '#333', lineHeight: 1.3, height: '32px', overflow: 'hidden' }}>
                                    {item.name}
                                </h4>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontWeight: 'bold', color: '#5D4E37', fontSize: '14px' }}>
                                        ₱{(item.price || 0).toLocaleString()}
                                    </span>
                                    {activeTab === 'products' && (
                                        <span style={{
                                            fontSize: '11px',
                                            padding: '2px 6px',
                                            borderRadius: '4px',
                                            backgroundColor: (item.stock || 0) > 10 ? '#e8f5e9' : (item.stock || 0) > 0 ? '#fff3e0' : '#ffebee',
                                            color: (item.stock || 0) > 10 ? '#2e7d32' : (item.stock || 0) > 0 ? '#ef6c00' : '#c62828'
                                        }}>
                                            {item.stock || 0} left
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '15px' }}>
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #ddd', cursor: 'pointer' }}
                            >
                                ← Prev
                            </button>
                            <span style={{ padding: '8px 16px' }}>Page {currentPage} of {totalPages}</span>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #ddd', cursor: 'pointer' }}
                            >
                                Next →
                            </button>
                        </div>
                    )}
                </div>

                {/* Right Panel - Cart */}
                <div style={{
                    flex: 1,
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    padding: '20px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <h3 style={{ margin: 0, color: '#5D4E37' }}>🛒 Cart ({cart.length})</h3>
                        {cart.length > 0 && (
                            <button
                                onClick={clearCart}
                                style={{ background: 'none', border: 'none', color: '#c62828', cursor: 'pointer', fontSize: '13px' }}
                            >
                                Clear All
                            </button>
                        )}
                    </div>

                    {/* Customer Selection */}
                    <div style={{ marginBottom: '15px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                            <label style={{ fontSize: '13px', color: '#666', fontWeight: 'bold' }}>Customer *</label>
                            <button
                                onClick={() => setShowNewCustomerModal(true)}
                                style={{
                                    background: 'none', border: 'none', color: '#5D4E37',
                                    cursor: 'pointer', fontSize: '12px', fontWeight: 'bold',
                                    display: 'flex', alignItems: 'center', gap: '4px'
                                }}
                            >
                                ➕ New
                            </button>
                        </div>
                        <div style={{ position: 'relative' }}>
                            <input
                                type="text"
                                placeholder="Search customer name..."
                                value={customerSearchTerm}
                                onChange={(e) => {
                                    setCustomerSearchTerm(e.target.value);
                                    setSelectedCustomer(null);
                                    setShowCustomerDropdown(true);
                                }}
                                onFocus={() => setShowCustomerDropdown(true)}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    border: '1px solid #E0D5C7',
                                    fontSize: '14px',
                                    boxSizing: 'border-box',
                                    backgroundColor: selectedCustomer ? '#f5f5f5' : 'white'
                                }}
                            />
                            {selectedCustomer && (
                                <button
                                    onClick={() => {
                                        setSelectedCustomer(null);
                                        setCustomerSearchTerm('');
                                    }}
                                    style={{
                                        position: 'absolute', right: '10px', top: '10px',
                                        background: 'none', border: 'none', color: '#888',
                                        cursor: 'pointer', fontSize: '16px'
                                    }}
                                >
                                    ✕
                                </button>
                            )}

                            {/* Dropdown Results */}
                            {showCustomerDropdown && customerSearchTerm && !selectedCustomer && (
                                <div style={{
                                    position: 'absolute', top: '100%', left: 0, right: 0,
                                    backgroundColor: 'white', borderRadius: '8px',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 10,
                                    maxHeight: '200px', overflowY: 'auto', border: '1px solid #ddd',
                                    marginTop: '4px'
                                }}>
                                    {customers.filter(c => 
                                        c.name?.toLowerCase().includes(customerSearchTerm.toLowerCase()) || 
                                        `${c.first_name} ${c.last_name}`.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
                                        c.customer_code?.toLowerCase().includes(customerSearchTerm.toLowerCase())
                                    ).map(customer => (
                                        <div
                                            key={customer.customer_id}
                                            onClick={() => {
                                                setSelectedCustomer(customer);
                                                setCustomerSearchTerm(customer.name || `${customer.first_name} ${customer.last_name}`);
                                                setShowCustomerDropdown(false);
                                            }}
                                            style={{
                                                padding: '10px 15px', borderBottom: '1px solid #eee',
                                                cursor: 'pointer', transition: 'background-color 0.2s'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                                        >
                                            <div style={{ fontWeight: 'bold', color: '#333' }}>
                                                {customer.name || `${customer.first_name} ${customer.last_name}`}
                                            </div>
                                            <div style={{ fontSize: '11px', color: '#888' }}>
                                                {customer.customer_code} • {customer.phone || 'No phone'}
                                            </div>
                                        </div>
                                    ))}
                                    {customers.filter(c => 
                                        c.name?.toLowerCase().includes(customerSearchTerm.toLowerCase()) || 
                                        `${c.first_name} ${c.last_name}`.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
                                        c.customer_code?.toLowerCase().includes(customerSearchTerm.toLowerCase())
                                    ).length === 0 && (
                                        <div style={{ padding: '12px 15px', color: '#888', fontSize: '13px', textAlign: 'center' }}>
                                            No customers found. Click ➕ New above.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Cart Items */}
                    <div style={{ flex: 1, overflowY: 'auto', marginBottom: '15px' }}>
                        {cart.length === 0 ? (
                            <div style={{ textAlign: 'center', color: '#888', padding: '40px 0' }}>
                                <p style={{ fontSize: '40px', marginBottom: '10px' }}>🛒</p>
                                <p>Cart is empty</p>
                            </div>
                        ) : (
                            cart.map(item => (
                                <div key={item.cartId} style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '10px',
                                    marginBottom: '8px',
                                    backgroundColor: '#F5F1EE',
                                    borderRadius: '8px'
                                }}>
                                    <div style={{ flex: 1 }}>
                                        <p style={{ margin: 0, fontWeight: '600', fontSize: '13px' }}>
                                            {item.name}
                                            {item.isService && <span style={{
                                                marginLeft: '5px',
                                                padding: '2px 6px',
                                                backgroundColor: '#e3f2fd',
                                                color: '#1976d2',
                                                borderRadius: '4px',
                                                fontSize: '10px'
                                            }}>SERVICE</span>}
                                        </p>
                                        <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#666' }}>
                                            ₱{item.price.toLocaleString()} × {item.quantity}
                                        </p>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <button
                                            onClick={() => updateQuantity(item.cartId, -1)}
                                            style={{
                                                width: '28px', height: '28px', borderRadius: '50%', border: 'none',
                                                backgroundColor: '#E0D5C7', cursor: 'pointer', fontWeight: 'bold'
                                            }}
                                        >-</button>
                                        <span style={{ minWidth: '20px', textAlign: 'center' }}>{item.quantity}</span>
                                        <button
                                            onClick={() => updateQuantity(item.cartId, 1)}
                                            style={{
                                                width: '28px', height: '28px', borderRadius: '50%', border: 'none',
                                                backgroundColor: '#5D4E37', color: 'white', cursor: 'pointer', fontWeight: 'bold'
                                            }}
                                        >+</button>
                                        <button
                                            onClick={() => removeFromCart(item.cartId)}
                                            style={{
                                                background: 'none', border: 'none', color: '#c62828',
                                                cursor: 'pointer', fontSize: '18px', marginLeft: '5px'
                                            }}
                                        >×</button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Payment Section */}
                    <div style={{ borderTop: '1px solid #E0D5C7', paddingTop: '15px' }}>
                        {/* Payment Method */}
                        <div style={{ marginBottom: '10px' }}>
                            <label style={{ fontSize: '13px', color: '#666', marginBottom: '5px', display: 'block' }}>Payment Method</label>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button
                                    onClick={() => setPaymentMethod('Cash')}
                                    style={{
                                        flex: 1, padding: '10px', borderRadius: '8px', border: 'none',
                                        backgroundColor: paymentMethod === 'Cash' ? '#5D4E37' : '#E0D5C7',
                                        color: paymentMethod === 'Cash' ? 'white' : '#5D4E37',
                                        fontWeight: 'bold', cursor: 'pointer'
                                    }}
                                >💵 Cash</button>
                                <button
                                    onClick={() => setPaymentMethod('GCash')}
                                    style={{
                                        flex: 1, padding: '10px', borderRadius: '8px', border: 'none',
                                        backgroundColor: paymentMethod === 'GCash' ? '#007bff' : '#E0D5C7',
                                        color: paymentMethod === 'GCash' ? 'white' : '#5D4E37',
                                        fontWeight: 'bold', cursor: 'pointer'
                                    }}
                                >📱 GCash</button>
                            </div>
                        </div>

                        {/* GCash QR Code Display */}
                        {paymentMethod === 'GCash' && gcashQrUrl && (
                            <div style={{
                                padding: '15px',
                                backgroundColor: '#e3f2fd',
                                borderRadius: '8px',
                                marginBottom: '10px',
                                textAlign: 'center'
                            }}>
                                <p style={{ margin: '0 0 10px', color: '#007bff', fontWeight: 'bold', fontSize: '13px' }}>
                                    Scan to Pay with GCash
                                </p>
                                <img
                                    src={gcashQrUrl}
                                    alt="GCash QR Code"
                                    style={{
                                        width: '144px',
                                        height: '144px',
                                        borderRadius: '8px',
                                        border: '2px solid #007bff'
                                    }}
                                />
                            </div>
                        )}

                        {/* Amount Tendered (Cash) */}
                        {paymentMethod === 'Cash' && (
                            <div style={{ marginBottom: '10px' }}>
                                <label style={{ fontSize: '13px', color: '#666', marginBottom: '5px', display: 'block' }}>Amount Tendered</label>
                                <input
                                    type="number"
                                    value={amountTendered}
                                    onChange={(e) => setAmountTendered(e.target.value)}
                                    placeholder="0.00"
                                    style={{
                                        width: '100%', padding: '12px', borderRadius: '8px',
                                        border: '1px solid #E0D5C7', fontSize: '16px', boxSizing: 'border-box'
                                    }}
                                />
                            </div>
                        )}

                        {/* Total */}
                        <div style={{
                            display: 'flex', justifyContent: 'space-between',
                            padding: '15px', backgroundColor: '#F5F1EE', borderRadius: '8px', marginBottom: '10px'
                        }}>
                            <span style={{ fontWeight: 'bold', color: '#5D4E37' }}>TOTAL</span>
                            <span style={{ fontWeight: 'bold', fontSize: '20px', color: '#2E7D32' }}>
                                ₱{calculateTotal().toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                        </div>

                        {/* Change (Cash) */}
                        {paymentMethod === 'Cash' && amountTendered && (
                            <div style={{
                                display: 'flex', justifyContent: 'space-between',
                                padding: '10px', backgroundColor: '#e8f5e9', borderRadius: '8px', marginBottom: '10px'
                            }}>
                                <span style={{ color: '#2E7D32' }}>Change</span>
                                <span style={{ fontWeight: 'bold', color: '#2E7D32' }}>
                                    ₱{calculateChange().toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                        )}

                        {/* Pay Button */}
                        <button
                            onClick={handlePayment}
                            disabled={cart.length === 0}
                            style={{
                                width: '100%', padding: '15px', borderRadius: '8px', border: 'none',
                                backgroundColor: cart.length === 0 ? '#ccc' : '#5D4E37',
                                color: 'white', fontWeight: 'bold', fontSize: '16px',
                                cursor: cart.length === 0 ? 'not-allowed' : 'pointer'
                            }}
                        >
                            Process Payment
                        </button>
                    </div>
                </div>

                {/* Receipt Preview Modal */}
                {showReceipt && (
                    <div className="modal-overlay" onClick={() => setShowReceipt(false)}>
                        <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
                            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                                <img src={clinicLogo} alt="Logo" style={{ width: '60px', height: '60px', borderRadius: '50%', marginBottom: '10px' }} />
                                <h2 style={{ margin: 0, color: '#5D4E37' }}>Order Summary</h2>
                            </div>

                            <div style={{ marginBottom: '15px' }}>
                                <p><strong>Customer:</strong> {selectedCustomer ? (selectedCustomer.name || `${selectedCustomer.first_name} ${selectedCustomer.last_name}`) : customerSearchTerm || 'Walk-in'}</p>
                                <p><strong>Payment:</strong> {paymentMethod}</p>
                            </div>

                            <div style={{ borderTop: '1px dashed #ccc', borderBottom: '1px dashed #ccc', padding: '10px 0', marginBottom: '15px' }}>
                                {cart.map(item => (
                                    <div key={item.cartId} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                        <span>{item.name} × {item.quantity}</span>
                                        <span>₱{(item.price * item.quantity).toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>

                            <div style={{ fontSize: '18px', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                                <span>Total:</span>
                                <span style={{ color: '#2E7D32' }}>₱{calculateTotal().toFixed(2)}</span>
                            </div>

                            {paymentMethod === 'Cash' && (
                                <>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                        <span>Tendered:</span>
                                        <span>₱{parseFloat(amountTendered).toFixed(2)}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                                        <span>Change:</span>
                                        <span style={{ color: '#2E7D32' }}>₱{calculateChange().toFixed(2)}</span>
                                    </div>
                                </>
                            )}

                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button
                                    onClick={() => setShowReceipt(false)}
                                    style={{
                                        flex: 1, padding: '12px', borderRadius: '8px',
                                        border: '1px solid #E0D5C7', backgroundColor: 'white',
                                        color: '#5D4E37', cursor: 'pointer', fontWeight: 'bold'
                                    }}
                                >Cancel</button>
                                <button
                                    onClick={confirmPayment}
                                    disabled={processing}
                                    style={{
                                        flex: 1, padding: '12px', borderRadius: '8px', border: 'none',
                                        backgroundColor: '#2E7D32', color: 'white',
                                        cursor: processing ? 'wait' : 'pointer', fontWeight: 'bold'
                                    }}
                                >{processing ? 'Processing...' : 'Confirm Payment'}</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Success Modal */}
                {showSuccess && receiptData && (
                    <div className="modal-overlay">
                        <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center' }}>
                            <div style={{ fontSize: '60px', marginBottom: '15px' }}>✅</div>
                            <h2 style={{ color: '#2E7D32', marginBottom: '10px' }}>Payment Successful!</h2>
                            <p style={{ color: '#666', marginBottom: '20px' }}>Receipt #{receiptData.receipt_number}</p>

                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button
                                    onClick={printReceipt}
                                    style={{
                                        flex: 1, padding: '12px', borderRadius: '8px',
                                        border: '1px solid #5D4E37', backgroundColor: 'white',
                                        color: '#5D4E37', cursor: 'pointer', fontWeight: 'bold'
                                    }}
                                >🖨️ Print Receipt</button>
                                <button
                                    onClick={handleSuccessClose}
                                    style={{
                                        flex: 1, padding: '12px', borderRadius: '8px', border: 'none',
                                        backgroundColor: '#5D4E37', color: 'white',
                                        cursor: 'pointer', fontWeight: 'bold'
                                    }}
                                >New Transaction</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Notification Modal */}
                {notification.show && (
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
                                borderRadius: '16px',
                                padding: '30px',
                                maxWidth: '400px',
                                width: '90%',
                                textAlign: 'center',
                                boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
                            }}
                        >
                            <div style={{
                                fontSize: '50px',
                                marginBottom: '15px'
                            }}>
                                {notification.type === 'error' && '❌'}
                                {notification.type === 'warning' && '⚠️'}
                                {notification.type === 'success' && '✅'}
                                {notification.type === 'info' && 'ℹ️'}
                            </div>
                            <h3 style={{
                                color: notification.type === 'error' ? '#C62828' :
                                    notification.type === 'warning' ? '#F57C00' :
                                        notification.type === 'success' ? '#2E7D32' : '#5D4E37',
                                marginBottom: '15px',
                                fontSize: '1.2rem'
                            }}>
                                {notification.type === 'error' ? 'Error' :
                                    notification.type === 'warning' ? 'Warning' :
                                        notification.type === 'success' ? 'Success' : 'Notice'}
                            </h3>
                            <p style={{
                                color: '#666',
                                marginBottom: '25px',
                                lineHeight: '1.5'
                            }}>
                                {notification.message}
                            </p>
                            <button
                                onClick={closeNotification}
                                style={{
                                    padding: '12px 40px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    backgroundColor: notification.type === 'error' ? '#C62828' :
                                        notification.type === 'warning' ? '#F57C00' :
                                            notification.type === 'success' ? '#2E7D32' : '#5D4E37',
                                    color: 'white',
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                    fontSize: '14px'
                                }}
                            >
                                OK
                            </button>
                        </div>
                    </div>
                )}

                {/* New Customer Modal */}
                {showNewCustomerModal && (
                    <div
                        className="modal-overlay"
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
                            style={{
                                background: 'white',
                                borderRadius: '12px',
                                padding: '25px',
                                width: '400px',
                                maxWidth: '90%',
                                boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <h3 style={{ margin: 0, color: '#5D4E37' }}>New Customer</h3>
                                <button
                                    onClick={() => setShowNewCustomerModal(false)}
                                    style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#888' }}
                                >
                                    ✕
                                </button>
                            </div>

                            <form onSubmit={handleCreateCustomer}>
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', color: '#666' }}>First Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={newCustomerForm.first_name}
                                        onChange={(e) => setNewCustomerForm({...newCustomerForm, first_name: e.target.value})}
                                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box' }}
                                    />
                                </div>
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', color: '#666' }}>Last Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={newCustomerForm.last_name}
                                        onChange={(e) => setNewCustomerForm({...newCustomerForm, last_name: e.target.value})}
                                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box' }}
                                    />
                                </div>
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', color: '#666' }}>Email (Optional)</label>
                                    <input
                                        type="email"
                                        value={newCustomerForm.email}
                                        onChange={(e) => setNewCustomerForm({...newCustomerForm, email: e.target.value})}
                                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box' }}
                                    />
                                </div>
                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', color: '#666' }}>Phone Number (Optional)</label>
                                    <input
                                        type="tel"
                                        value={newCustomerForm.phone}
                                        onChange={(e) => setNewCustomerForm({...newCustomerForm, phone: e.target.value})}
                                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box' }}
                                    />
                                </div>

                                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                    <button
                                        type="button"
                                        onClick={() => setShowNewCustomerModal(false)}
                                        style={{ padding: '10px 15px', borderRadius: '6px', border: '1px solid #ddd', background: 'white', cursor: 'pointer' }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={creatingCustomer}
                                        style={{ padding: '10px 15px', borderRadius: '6px', border: 'none', background: '#5D4E37', color: 'white', cursor: creatingCustomer ? 'wait' : 'pointer' }}
                                    >
                                        {creatingCustomer ? 'Saving...' : 'Save Customer'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CashierPOS;
