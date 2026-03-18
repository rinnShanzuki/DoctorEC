import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { cachedGet, invalidateCache } from '../../services/apiCache';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useNotification } from '../hooks/useNotification';
import './Dashboard.css';

const COLORS = ['#5D4E37', '#8B7355', '#A0522D', '#CD853F', '#DEB887', '#F5DEB3'];

const AdminInventory = () => {
    const [activeTab, setActiveTab] = useState('products');
    const [products, setProducts] = useState([]);
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');

    // Analytics state
    const [analytics, setAnalytics] = useState({
        total_revenue: 0,
        month_revenue: 0,
        total_transactions: 0,
        best_sellers: [],
        monthly_income: [],
        service_stats: [],
        stock_trend: []
    });

    // Modal states
    const [showStockModal, setShowStockModal] = useState(false);
    const [showPriceModal, setShowPriceModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [newStockLevel, setNewStockLevel] = useState(0);
    const [newPrice, setNewPrice] = useState(0);
    const [itemType, setItemType] = useState('product');
    const { showNotification, NotificationModal } = useNotification();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        await Promise.all([
            fetchProducts(),
            fetchServices(),
            fetchAnalytics()
        ]);
        setLoading(false);
    };

    const fetchProducts = async () => {
        try {
            const { data: response } = await cachedGet('/products');
            const data = response.data.data || response.data;
            setProducts(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching products:', error);
            setProducts([]);
        }
    };

    const fetchServices = async () => {
        try {
            const { data: response } = await cachedGet('/services/with-stats');
            const data = response.data.data || response.data;
            setServices(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching services:', error);
            setServices([]);
        }
    };

    const fetchAnalytics = async () => {
        try {
            const { data: response } = await cachedGet('/inventory/analytics');
            const data = response.data.data || response.data;

            setAnalytics({
                total_revenue: data.total_revenue || 0,
                month_revenue: data.month_revenue || 0,
                total_transactions: data.total_transactions || 0,
                best_sellers: Array.isArray(data.best_sellers) ? data.best_sellers : [],
                monthly_income: Array.isArray(data.monthly_income) ? data.monthly_income : [],
                service_stats: Array.isArray(data.service_stats) ? data.service_stats : [],
                stock_trend: Array.isArray(data.stock_trend) ? data.stock_trend : []
            });
        } catch (error) {
            console.error('Error fetching analytics:', error);
        }
    };

    const handleStockClick = (product) => {
        setSelectedItem(product);
        setNewStockLevel(product.stock || 0);
        setItemType('product');
        setShowStockModal(true);
    };

    const handlePriceClick = (item, type) => {
        setSelectedItem(item);
        setNewPrice(item.price || 0);
        setItemType(type);
        setShowPriceModal(true);
    };

    const handleStockUpdate = async () => {
        try {
            await adminAPI.updateProduct(selectedItem.product_id, { stock: newStockLevel });
            await fetchProducts();
            await fetchAnalytics();
            setShowStockModal(false);
            showNotification('Stock updated successfully!', 'success');
        } catch (error) {
            console.error('Error updating stock:', error);
            showNotification('Failed to update stock', 'error');
        }
    };

    const handlePriceUpdate = async () => {
        try {
            if (itemType === 'product') {
                await adminAPI.updateProduct(selectedItem.product_id, { price: newPrice });
                await fetchProducts();
            } else {
                await adminAPI.updateService(selectedItem.service_id, { price: newPrice });
                await fetchServices();
            }
            setShowPriceModal(false);
            showNotification('Price updated successfully!', 'success');
        } catch (error) {
            console.error('Error updating price:', error);
            showNotification('Failed to update price', 'error');
        }
    };

    // Filtered products
    const filteredProducts = products.filter(product => {
        const matchesSearch = product.name?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = categoryFilter === 'All' || product.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    // Stats calculations
    const totalStock = products.reduce((sum, p) => sum + (p.stock || 0), 0);
    const lowStockCount = products.filter(p => (p.stock || 0) < 10 && (p.stock || 0) > 0).length;
    const categories = ['All', ...new Set(products.map(p => p.category).filter(Boolean))];

    const getStockStatus = (stock) => {
        if (stock === 0) return { text: 'Out of Stock', color: '#c62828', bg: '#ffebee' };
        if (stock < 10) return { text: 'Low Stock', color: '#ef6c00', bg: '#fff3e0' };
        return { text: 'In Stock', color: '#2e7d32', bg: '#e8f5e9' };
    };

    if (loading) return <div className="dashboard-loading"><div className="spinner"></div></div>;

    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <h1>📊 Smart Inventory Dashboard</h1>
            </div>

            {/* Low Stock Alert - Expandable */}
            {(() => {
                const lowStockProducts = products.filter(p => (p.stock || 0) < 10 && (p.stock || 0) > 0);
                const outOfStockProducts = products.filter(p => (p.stock || 0) === 0);
                const totalAlerts = lowStockProducts.length + outOfStockProducts.length;
                if (totalAlerts === 0) return null;
                return (
                    <div style={{
                        backgroundColor: '#fff3e0',
                        borderRadius: '12px',
                        marginBottom: '20px',
                        border: '1px solid #ef6c00',
                        overflow: 'hidden'
                    }}>
                        <div
                            onClick={() => {
                                const el = document.getElementById('low-stock-expand');
                                if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
                            }}
                            style={{
                                padding: '15px 20px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '15px',
                                cursor: 'pointer',
                                userSelect: 'none'
                            }}
                        >
                            <span style={{ fontSize: '24px' }}>⚠️</span>
                            <div style={{ flex: 1 }}>
                                <strong style={{ color: '#e65100' }}>Stock Alert!</strong>
                                <p style={{ margin: '3px 0 0', color: '#5D4E37', fontSize: '13px' }}>
                                    {outOfStockProducts.length > 0 && <span style={{ color: '#c62828', fontWeight: 'bold' }}>{outOfStockProducts.length} out of stock</span>}
                                    {outOfStockProducts.length > 0 && lowStockProducts.length > 0 && ' · '}
                                    {lowStockProducts.length > 0 && <span style={{ color: '#ef6c00', fontWeight: 'bold' }}>{lowStockProducts.length} low stock</span>}
                                </p>
                            </div>
                            <span style={{ color: '#ef6c00', fontSize: '12px', fontWeight: 600 }}>▼ Click to expand</span>
                        </div>
                        <div id="low-stock-expand" style={{ display: 'none', borderTop: '1px solid #f0c27a' }}>
                            {/* Out of stock items first */}
                            {outOfStockProducts.map(product => (
                                <div key={product.product_id} style={{
                                    display: 'flex', alignItems: 'center', padding: '10px 20px',
                                    borderBottom: '1px solid #f0e0c8', borderLeft: '4px solid #c62828',
                                    backgroundColor: '#fff8f6', gap: '12px'
                                }}>
                                    <div style={{ flex: 1 }}>
                                        <span style={{ fontWeight: 600, fontSize: '13px', color: '#3E2723' }}>{product.name}</span>
                                        <span style={{ fontSize: '11px', color: '#888', marginLeft: '8px' }}>{product.category}</span>
                                    </div>
                                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#c62828', backgroundColor: '#ffebee', padding: '2px 8px', borderRadius: '6px' }}>
                                        Out of Stock
                                    </span>
                                    <button onClick={() => handleStockClick(product)} style={{
                                        padding: '5px 12px', backgroundColor: '#5D4E37', color: 'white',
                                        border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold'
                                    }}>Restock</button>
                                </div>
                            ))}
                            {/* Low stock items */}
                            {lowStockProducts.map(product => (
                                <div key={product.product_id} style={{
                                    display: 'flex', alignItems: 'center', padding: '10px 20px',
                                    borderBottom: '1px solid #f0e0c8', borderLeft: '4px solid #ef6c00',
                                    backgroundColor: '#fffdf9', gap: '12px'
                                }}>
                                    <div style={{ flex: 1 }}>
                                        <span style={{ fontWeight: 600, fontSize: '13px', color: '#3E2723' }}>{product.name}</span>
                                        <span style={{ fontSize: '11px', color: '#888', marginLeft: '8px' }}>{product.category}</span>
                                    </div>
                                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#ef6c00', backgroundColor: '#fff3e0', padding: '2px 8px', borderRadius: '6px' }}>
                                        {product.stock} left
                                    </span>
                                    <button onClick={() => handleStockClick(product)} style={{
                                        padding: '5px 12px', backgroundColor: '#5D4E37', color: 'white',
                                        border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold'
                                    }}>Restock</button>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })()}

            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '15px', marginBottom: '20px' }}>
                <div className="stat-card">
                    <div className="stat-icon" style={{ backgroundColor: '#e3f2fd', color: '#1976d2' }}>💰</div>
                    <div className="stat-info">
                        <h3>This Month</h3>
                        <p>₱{(analytics.month_revenue || 0).toLocaleString()}</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ backgroundColor: '#e8f5e9', color: '#2e7d32' }}>📦</div>
                    <div className="stat-info">
                        <h3>Total Stock</h3>
                        <p>{totalStock}</p>
                    </div>
                </div>
                <div className="stat-card" style={{ borderColor: lowStockCount > 0 ? '#ef6c00' : 'transparent', borderWidth: '2px', borderStyle: 'solid' }}>
                    <div className="stat-icon" style={{ backgroundColor: '#fff3e0', color: '#ef6c00' }}>⚠️</div>
                    <div className="stat-info">
                        <h3>Low Stock</h3>
                        <p>{lowStockCount}</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ backgroundColor: '#f3e5f5', color: '#7b1fa2' }}>🛒</div>
                    <div className="stat-info">
                        <h3>Total Sales</h3>
                        <p>{analytics.total_transactions || 0}</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ backgroundColor: '#e0f2f1', color: '#00796b' }}>🏥</div>
                    <div className="stat-info">
                        <h3>Services</h3>
                        <p>{services.length}</p>
                    </div>
                </div>
            </div>

            {/* Charts */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                {/* Monthly Income */}
                <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ marginBottom: '15px', color: '#5D4E37' }}>📈 Monthly Income</h3>
                    {analytics.monthly_income.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                            <LineChart data={analytics.monthly_income}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" />
                                <YAxis />
                                <Tooltip />
                                <Line type="monotone" dataKey="revenue" stroke="#5D4E37" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div style={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: '#888' }}>
                            <span style={{ fontSize: '48px' }}>📊</span>
                            <p>No sales data yet</p>
                        </div>
                    )}
                </div>

                {/* Best Sellers */}
                <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ marginBottom: '15px', color: '#5D4E37' }}>📊 Best Sellers</h3>
                    {analytics.best_sellers.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={analytics.best_sellers}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="item_name" angle={-20} textAnchor="end" height={80} />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="total_sold" fill="#5D4E37" />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div style={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: '#888' }}>
                            <span style={{ fontSize: '48px' }}>🏆</span>
                            <p>No sales yet</p>
                        </div>
                    )}
                </div>

                {/* Stock Levels */}
                <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ marginBottom: '15px', color: '#5D4E37' }}>📉 Top 5 Products by Stock</h3>
                    {analytics.stock_trend.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={analytics.stock_trend} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" />
                                <YAxis dataKey="name" type="category" width={100} />
                                <Tooltip />
                                <Bar dataKey="stock" fill="#2e7d32" />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div style={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: '#888' }}>
                            <span style={{ fontSize: '48px' }}>📦</span>
                            <p>No products yet</p>
                        </div>
                    )}
                </div>

                {/* Services */}
                <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ marginBottom: '15px', color: '#5D4E37' }}>🍩 Services</h3>
                    {analytics.service_stats.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie
                                    data={analytics.service_stats}
                                    dataKey="count"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={80}
                                    label
                                >
                                    {analytics.service_stats.map((entry, index) => (
                                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div style={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: '#888' }}>
                            <span style={{ fontSize: '48px' }}>🏥</span>
                            <p>No appointments yet</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '2px solid #E0D5C7', paddingBottom: '10px' }}>
                {['products', 'services'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                            padding: '10px 25px',
                            backgroundColor: activeTab === tab ? '#5D4E37' : 'transparent',
                            color: activeTab === tab ? 'white' : '#5D4E37',
                            border: activeTab === tab ? 'none' : '1px solid #5D4E37',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            textTransform: 'capitalize'
                        }}
                    >
                        {tab === 'products' ? '📦 Products' : '🏥 Services'}
                    </button>
                ))}
            </div>

            {/* Products Tab */}
            {activeTab === 'products' && (
                <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
                        <input
                            type="text"
                            placeholder="🔍 Search products..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                flex: 1,
                                padding: '12px 15px',
                                borderRadius: '8px',
                                border: '1px solid #ddd',
                                fontSize: '14px'
                            }}
                        />
                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            style={{
                                padding: '12px 15px',
                                borderRadius: '8px',
                                border: '1px solid #ddd',
                                fontSize: '14px',
                                minWidth: '150px'
                            }}
                        >
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>

                    <table className="dashboard-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Name</th>
                                <th>Category</th>
                                <th>Price</th>
                                <th>Stock</th>
                                <th>Monthly Sold</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProducts.map(product => {
                                const status = getStockStatus(product.stock || 0);
                                return (
                                    <tr key={product.product_id}>
                                        <td>{product.product_id}</td>
                                        <td style={{ fontWeight: '500' }}>{product.name}</td>
                                        <td>{product.category}</td>
                                        <td style={{ color: '#1976d2', fontWeight: 'bold' }}>₱{(product.price || 0).toLocaleString()}</td>
                                        <td style={{ fontWeight: 'bold', color: status.color }}>{product.stock || 0}</td>
                                        <td style={{ fontWeight: 'bold', color: '#7b1fa2' }}>{product.monthly_sold || 0}</td>
                                        <td>
                                            <span style={{
                                                padding: '4px 12px',
                                                borderRadius: '20px',
                                                fontSize: '12px',
                                                fontWeight: 'bold',
                                                backgroundColor: status.bg,
                                                color: status.color
                                            }}>
                                                {status.text}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button
                                                    onClick={() => handleStockClick(product)}
                                                    style={{
                                                        padding: '6px 12px',
                                                        backgroundColor: '#e3f2fd',
                                                        color: '#1976d2',
                                                        border: 'none',
                                                        borderRadius: '6px',
                                                        cursor: 'pointer',
                                                        fontSize: '12px',
                                                        fontWeight: 'bold'
                                                    }}
                                                >
                                                    📦 Stock
                                                </button>
                                                <button
                                                    onClick={() => handlePriceClick(product, 'product')}
                                                    style={{
                                                        padding: '6px 12px',
                                                        backgroundColor: '#f3e5f5',
                                                        color: '#7b1fa2',
                                                        border: 'none',
                                                        borderRadius: '6px',
                                                        cursor: 'pointer',
                                                        fontSize: '12px',
                                                        fontWeight: 'bold'
                                                    }}
                                                >
                                                    💰 Price
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Services Tab */}
            {activeTab === 'services' && (
                <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ marginBottom: '15px', color: '#5D4E37' }}>🏥 Services Management</h3>
                    <table className="dashboard-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Service Name</th>
                                <th>Description</th>
                                <th>Price</th>
                                <th>Monthly Availed</th>
                                <th>Total Availed</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {services.map(service => (
                                <tr key={service.service_id}>
                                    <td>{service.service_id}</td>
                                    <td style={{ fontWeight: '500' }}>{service.name}</td>
                                    <td style={{ maxWidth: '200px' }}>{service.description}</td>
                                    <td style={{ color: '#1976d2', fontWeight: 'bold' }}>₱{(service.price || 0).toLocaleString()}</td>
                                    <td style={{ fontWeight: 'bold', color: '#2e7d32' }}>{service.monthly_availed || 0}</td>
                                    <td style={{ fontWeight: 'bold', color: '#5D4E37' }}>{service.total_availed || 0}</td>
                                    <td>
                                        <button
                                            onClick={() => handlePriceClick(service, 'service')}
                                            style={{
                                                padding: '6px 12px',
                                                backgroundColor: '#f3e5f5',
                                                color: '#7b1fa2',
                                                border: 'none',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                fontSize: '12px',
                                                fontWeight: 'bold'
                                            }}
                                        >
                                            💰 Price
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Stock Modal */}
            {showStockModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '400px' }}>
                        <h3>📦 Update Stock</h3>
                        <p style={{ color: '#666', marginBottom: '20px' }}>
                            Product: <strong>{selectedItem?.name}</strong>
                        </p>
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                                Current: {selectedItem?.stock || 0}
                            </label>
                            <input
                                type="number"
                                value={newStockLevel}
                                onChange={(e) => setNewStockLevel(parseInt(e.target.value) || 0)}
                                min="0"
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    border: '1px solid #ddd',
                                    fontSize: '16px'
                                }}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                                onClick={() => setShowStockModal(false)}
                                style={{ flex: 1, padding: '12px', border: '1px solid #ddd', backgroundColor: 'white', borderRadius: '8px', cursor: 'pointer' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleStockUpdate}
                                style={{ flex: 1, padding: '12px', backgroundColor: '#5D4E37', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                            >
                                Update
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Price Modal */}
            {showPriceModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '400px' }}>
                        <h3>💰 Update Price</h3>
                        <p style={{ color: '#666', marginBottom: '20px' }}>
                            {itemType === 'product' ? 'Product' : 'Service'}: <strong>{selectedItem?.name}</strong>
                        </p>
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                                Current: ₱{(selectedItem?.price || 0).toLocaleString()}
                            </label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ fontSize: '18px', fontWeight: 'bold' }}>₱</span>
                                <input
                                    type="number"
                                    value={newPrice}
                                    onChange={(e) => setNewPrice(parseFloat(e.target.value) || 0)}
                                    min="0"
                                    step="0.01"
                                    style={{
                                        flex: 1,
                                        padding: '12px',
                                        borderRadius: '8px',
                                        border: '1px solid #ddd',
                                        fontSize: '16px'
                                    }}
                                />
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                                onClick={() => setShowPriceModal(false)}
                                style={{ flex: 1, padding: '12px', border: '1px solid #ddd', backgroundColor: 'white', borderRadius: '8px', cursor: 'pointer' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handlePriceUpdate}
                                style={{ flex: 1, padding: '12px', backgroundColor: '#5D4E37', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                            >
                                Update
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {NotificationModal}
        </div>
    );
};

export default AdminInventory;
