import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { cachedGet } from '../../services/apiCache';
import { useNavigate } from 'react-router-dom';
import {
    PieChart, Pie, Cell,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    LineChart, Line, AreaChart, Area
} from 'recharts';
import './Dashboard.css';

const COLORS = ['#5D4E37', '#8B7355', '#A89279', '#C4B098', '#D7CCC8', '#E8DDD3'];

const Dashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalPatients: 0,
        totalDoctors: 0,
        totalProducts: 0
    });
    const [pendingAppointments, setPendingAppointments] = useState([]);
    const [revenueSnapshot, setRevenueSnapshot] = useState({ today: 0, week: 0, month: 0, year: 0 });
    const [productData, setProductData] = useState([]);
    const [appointmentData, setAppointmentData] = useState([]);
    const [monthlyIncome, setMonthlyIncome] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const { data: response, fromCache } = await cachedGet('/dashboard/all');
            const data = response.data?.data || response.data;

            if (data) {
                if (data.stats) setStats(data.stats);
                if (data.pendingAppointments) setPendingAppointments(data.pendingAppointments);
                if (data.revenueSnapshot) setRevenueSnapshot(data.revenueSnapshot);
                if (data.productDistribution) setProductData(data.productDistribution);
                if (data.appointmentTrends) setAppointmentData(data.appointmentTrends);
                if (data.monthlyIncome) setMonthlyIncome(data.monthlyIncome);
            }

            if (fromCache) setLoading(false);
            setError('');
        } catch (err) {
            console.error('Error fetching dashboard data:', err);
            setError('Failed to load some dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return '₱' + Number(amount).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getStatusBadge = (status) => {
        const statusClasses = {
            pending: 'status-pending',
            confirmed: 'status-confirmed',
            completed: 'status-completed',
            cancelled: 'status-cancelled',
        };
        return <span className={`status-badge ${statusClasses[status] || ''}`}>{status}</span>;
    };

    const handleCardClick = (route) => {
        navigate(route);
    };

    // Custom tooltip for charts
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="custom-chart-tooltip">
                    <p className="tooltip-label">{label}</p>
                    {payload.map((entry, index) => (
                        <p key={index} style={{ color: entry.color }} className="tooltip-value">
                            {entry.name}: {entry.name === 'income' ? formatCurrency(entry.value) : entry.value}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    if (loading) {
        return (
            <div className="dashboard-loading">
                <div className="spinner"></div>
                <p>Loading dashboard...</p>
            </div>
        );
    }

    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <h1>Dashboard Overview</h1>
                <p className="dashboard-subtitle">Welcome back! Here's what's happening today.</p>
            </div>

            {error && (
                <div className="error-banner">
                    {error}
                </div>
            )}

            {/* ========= STAT CARDS ========= */}
            <div className="stats-grid">
                <div
                    className="stat-card stat-card-users"
                    onClick={() => handleCardClick('/admin/dashboard/users')}
                >
                    <div className="stat-icon-container">
                        <span className="stat-emoji">👥</span>
                    </div>
                    <div className="stat-info">
                        <p className="stat-label">Total Users</p>
                        <h2 className="stat-value">{stats.totalUsers}</h2>
                    </div>
                </div>

                <div
                    className="stat-card stat-card-patients"
                    onClick={() => handleCardClick('/admin/dashboard/walk-in-patients')}
                >
                    <div className="stat-icon-container">
                        <span className="stat-emoji">🏥</span>
                    </div>
                    <div className="stat-info">
                        <p className="stat-label">Total Patients</p>
                        <h2 className="stat-value">{stats.totalPatients}</h2>
                    </div>
                </div>

                <div
                    className="stat-card stat-card-doctors"
                    onClick={() => handleCardClick('/admin/dashboard/optometrist')}
                >
                    <div className="stat-icon-container">
                        <span className="stat-emoji">👨‍⚕️</span>
                    </div>
                    <div className="stat-info">
                        <p className="stat-label">Total Doctors</p>
                        <h2 className="stat-value">{stats.totalDoctors}</h2>
                    </div>
                </div>

                <div
                    className="stat-card stat-card-products"
                    onClick={() => handleCardClick('/admin/dashboard/products')}
                >
                    <div className="stat-icon-container">
                        <span className="stat-emoji">📦</span>
                    </div>
                    <div className="stat-info">
                        <p className="stat-label">Total Products</p>
                        <h2 className="stat-value">{stats.totalProducts}</h2>
                    </div>
                </div>
            </div>

            {/* ========= ANALYTICS SECTION ========= */}
            <div className="analytics-section">
                {/* Row 1: Pending Appointments + Revenue Snapshot */}
                <div className="analytics-row analytics-row-2col">
                    {/* Pending Appointments Table */}
                    <div className="chart-card">
                        <div className="chart-card-header">
                            <h3>📋 Pending Appointments</h3>
                            <button className="view-all-btn" onClick={() => navigate('/admin/dashboard/appointments')}>View All</button>
                        </div>
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Patient</th>
                                        <th>Date</th>
                                        <th>Service</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pendingAppointments.length > 0 ? (
                                        pendingAppointments.map((apt) => (
                                            <tr key={apt.id}>
                                                <td>
                                                    {apt.clientAccount
                                                        ? `${apt.clientAccount.first_name || ''} ${apt.clientAccount.last_name || ''}`.trim()
                                                        : 'Walk-In'}
                                                </td>
                                                <td>{formatDate(apt.appointment_date)}</td>
                                                <td>{apt.service?.name || 'N/A'}</td>
                                                <td>{getStatusBadge(apt.status)}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="4" className="no-data">No pending appointments</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Revenue Snapshot */}
                    <div className="chart-card revenue-card">
                        <div className="chart-card-header">
                            <h3>💰 Revenue Snapshot</h3>
                        </div>
                        <div className="revenue-grid">
                            <div className="revenue-item">
                                <span className="revenue-period">Today</span>
                                <span className="revenue-amount">{formatCurrency(revenueSnapshot.today)}</span>
                            </div>
                            <div className="revenue-item">
                                <span className="revenue-period">This Week</span>
                                <span className="revenue-amount">{formatCurrency(revenueSnapshot.week)}</span>
                            </div>
                            <div className="revenue-item">
                                <span className="revenue-period">This Month</span>
                                <span className="revenue-amount revenue-highlight">{formatCurrency(revenueSnapshot.month)}</span>
                            </div>
                            <div className="revenue-item">
                                <span className="revenue-period">This Year</span>
                                <span className="revenue-amount revenue-highlight-year">{formatCurrency(revenueSnapshot.year)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Row 2: Product Distribution + Appointment Trends */}
                <div className="analytics-row analytics-row-2col">
                    {/* Product Distribution Chart (Pie) */}
                    <div className="chart-card">
                        <div className="chart-card-header">
                            <h3>📊 Product Distribution</h3>
                        </div>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={productData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={55}
                                    outerRadius={95}
                                    paddingAngle={4}
                                    dataKey="value"
                                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                >
                                    {productData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Appointment Trends Chart (Line/Area) */}
                    <div className="chart-card">
                        <div className="chart-card-header">
                            <h3>📈 Appointment Trends</h3>
                        </div>
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={appointmentData}>
                                <defs>
                                    <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#5D4E37" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#5D4E37" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="gradConfirmed" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#388E3C" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#388E3C" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#E8DDD3" />
                                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#8B7355' }} />
                                <YAxis tick={{ fontSize: 12, fill: '#8B7355' }} />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend />
                                <Area type="monotone" dataKey="total" stroke="#5D4E37" fill="url(#gradTotal)" strokeWidth={2} name="Total" />
                                <Area type="monotone" dataKey="confirmed" stroke="#388E3C" fill="url(#gradConfirmed)" strokeWidth={2} name="Confirmed" />
                                <Line type="monotone" dataKey="pending" stroke="#F57C00" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 4 }} name="Pending" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Row 3: Monthly Income Overview (Full Width) */}
                <div className="analytics-row analytics-row-full">
                    <div className="chart-card">
                        <div className="chart-card-header">
                            <h3>💵 Monthly Income Overview</h3>
                        </div>
                        <ResponsiveContainer width="100%" height={320}>
                            <BarChart data={monthlyIncome} barSize={40}>
                                <defs>
                                    <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#5D4E37" stopOpacity={1} />
                                        <stop offset="100%" stopColor="#A89279" stopOpacity={0.8} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#E8DDD3" vertical={false} />
                                <XAxis dataKey="name" tick={{ fontSize: 13, fill: '#5D4E37', fontWeight: 600 }} />
                                <YAxis tick={{ fontSize: 12, fill: '#8B7355' }} tickFormatter={(value) => `₱${(value / 1000).toFixed(0)}k`} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="income" fill="url(#incomeGradient)" radius={[6, 6, 0, 0]} name="income" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
