import React, { useState, useEffect, useCallback } from 'react';
import api, { adminAPI } from '../../services/api';
import './Dashboard.css';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { FaCalendarCheck, FaUserMd, FaMoneyBillWave, FaBoxOpen, FaUsers, FaBrain, FaExclamationTriangle, FaChartLine } from 'react-icons/fa';

const COLORS = ['#2e7d32', '#c62828', '#ef6c00', '#1565c0', '#6a1b9a', '#8B7355'];

const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 0 }).format(amount || 0);

const StatCard = ({ icon, label, value, color }) => (
    <div className="stat-card">
        <div className="stat-icon" style={{ backgroundColor: color + '22' }}>{React.cloneElement(icon, { style: { color } })}</div>
        <div className="stat-info">
            <p className="stat-label">{label}</p>
            <p className="stat-value">{value}</p>
        </div>
    </div>
);

// ─── TAB COMPONENTS ───────────────────────────────────────────────────────────

const AppointmentsTab = ({ data }) => {
    if (!data) return <div className="dashboard-loading"><div className="spinner" /></div>;
    const { summary, status_chart, trend_chart, top_services, top_doctors } = data;

    return (
        <div>
            <div className="stats-grid" style={{ marginBottom: 24 }}>
                <StatCard icon={<FaCalendarCheck />} label="Total Appointments" value={summary.total} color="#1565c0" />
                <StatCard icon={<FaCalendarCheck />} label="Completed" value={summary.completed} color="#2e7d32" />
                <StatCard icon={<FaCalendarCheck />} label="Pending" value={summary.pending} color="#ef6c00" />
                <StatCard icon={<FaCalendarCheck />} label="Cancelled" value={summary.cancelled} color="#c62828" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
                <div className="chart-container" style={{ padding: 20 }}>
                    <h3 style={{ marginBottom: 16, color: '#5D4E37' }}>Appointment Status</h3>
                    <div style={{ height: 280 }}>
                        {status_chart?.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={status_chart} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={4} dataKey="value">
                                        {status_chart.map((e, i) => <Cell key={i} fill={e.color || COLORS[i % COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip /><Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : <p style={{ color: '#888', textAlign: 'center', marginTop: 60 }}>No data</p>}
                    </div>
                </div>
                <div className="chart-container" style={{ padding: 20 }}>
                    <h3 style={{ marginBottom: 16, color: '#5D4E37' }}>Daily Trend</h3>
                    <div style={{ height: 280 }}>
                        {trend_chart?.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={trend_chart}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                                    <YAxis allowDecimals={false} />
                                    <Tooltip />
                                    <Area type="monotone" dataKey="count" stroke="#5D4E37" fill="#D7CCC8" name="Appointments" />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : <p style={{ color: '#888', textAlign: 'center', marginTop: 60 }}>No data</p>}
                    </div>
                </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                <div className="chart-container" style={{ padding: 20 }}>
                    <h3 style={{ marginBottom: 16, color: '#5D4E37' }}>Top Services</h3>
                    {top_services?.length > 0 ? (
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={top_services} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" allowDecimals={false} />
                                <YAxis dataKey="service" type="category" width={120} tick={{ fontSize: 11 }} />
                                <Tooltip />
                                <Bar dataKey="count" fill="#5D4E37" />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : <p style={{ color: '#888' }}>No data</p>}
                </div>
                <div className="chart-container" style={{ padding: 20 }}>
                    <h3 style={{ marginBottom: 16, color: '#5D4E37' }}>Top Doctors</h3>
                    {top_doctors?.length > 0 ? (
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={top_doctors} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" allowDecimals={false} />
                                <YAxis dataKey="doctor" type="category" width={120} tick={{ fontSize: 11 }} />
                                <Tooltip />
                                <Bar dataKey="count" fill="#8B7355" />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : <p style={{ color: '#888' }}>No data</p>}
                </div>
            </div>
        </div>
    );
};

const ServicesTab = ({ data }) => {
    if (!data) return <div className="dashboard-loading"><div className="spinner" /></div>;
    const { popularity_chart, table } = data;

    return (
        <div>
            <div className="chart-container" style={{ padding: 20, marginBottom: 24 }}>
                <h3 style={{ marginBottom: 16, color: '#5D4E37' }}>Service Popularity</h3>
                {popularity_chart?.length > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={popularity_chart}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                            <YAxis allowDecimals={false} />
                            <Tooltip /><Legend />
                            <Bar dataKey="count" fill="#5D4E37" name="Times Availed" />
                        </BarChart>
                    </ResponsiveContainer>
                ) : <p style={{ color: '#888', textAlign: 'center' }}>No service data</p>}
            </div>
            <div className="chart-container" style={{ padding: 20 }}>
                <h3 style={{ marginBottom: 16, color: '#5D4E37' }}>Service Details</h3>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                        <thead>
                            <tr style={{ backgroundColor: '#faf8f5', borderBottom: '2px solid #E0D5C7' }}>
                                {['Service', 'Price', 'Times Availed', 'Est. Revenue', 'Last Availed'].map(h => (
                                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', color: '#5D4E37', fontWeight: 700 }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {table?.map((s, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid #f0ebe5' }}>
                                    <td style={{ padding: '10px 16px', fontWeight: 600 }}>{s.name}</td>
                                    <td style={{ padding: '10px 16px' }}>{s.price}</td>
                                    <td style={{ padding: '10px 16px', textAlign: 'center' }}><span style={{ background: '#e8f5e9', color: '#2e7d32', padding: '2px 10px', borderRadius: 12, fontWeight: 600 }}>{s.times_availed}</span></td>
                                    <td style={{ padding: '10px 16px' }}>{s.total_revenue}</td>
                                    <td style={{ padding: '10px 16px', color: '#888' }}>{s.days_since_last > 0 ? `${s.days_since_last}d ago` : 'Today'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const SalesTab = ({ data }) => {
    if (!data) return <div className="dashboard-loading"><div className="spinner" /></div>;
    const { summary = {}, daily_trend, top_products, inventory = {} } = data;

    return (
        <div>
            <div className="stats-grid" style={{ marginBottom: 24 }}>
                <StatCard icon={<FaMoneyBillWave />} label="Total Revenue" value={formatCurrency(summary.total_revenue)} color="#2e7d32" />
                <StatCard icon={<FaBoxOpen />} label="Transactions" value={summary.transaction_count} color="#1565c0" />
                <StatCard icon={<FaMoneyBillWave />} label="Avg Order Value" value={formatCurrency(summary.avg_order_value)} color="#ef6c00" />
                <StatCard icon={<FaBoxOpen />} label="Low Stock Items" value={inventory?.low_stock_count ?? 0} color="#c62828" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
                <div className="chart-container" style={{ padding: 20 }}>
                    <h3 style={{ marginBottom: 16, color: '#5D4E37' }}>Daily Revenue</h3>
                    {daily_trend?.length > 0 ? (
                        <ResponsiveContainer width="100%" height={260}>
                            <AreaChart data={daily_trend}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                                <YAxis tickFormatter={v => `₱${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                                <Tooltip formatter={v => formatCurrency(v)} />
                                <Area type="monotone" dataKey="revenue" stroke="#5D4E37" fill="#D7CCC8" name="Revenue" />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : <p style={{ color: '#888', textAlign: 'center', marginTop: 60 }}>No sales data</p>}
                </div>
                <div className="chart-container" style={{ padding: 20 }}>
                    <h3 style={{ marginBottom: 16, color: '#5D4E37' }}>Inventory Summary</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {[
                            { label: 'Total Products', value: inventory.total_products, bg: '#f5f5f5', color: '#333' },
                            { label: 'Total Stock Units', value: inventory.total_stock?.toLocaleString(), bg: '#e8f5e9', color: '#2e7d32' },
                            { label: 'Total Inventory Value', value: formatCurrency(inventory.total_value), bg: '#e3f2fd', color: '#1565c0' },
                            { label: 'Low Stock (<10)', value: inventory.low_stock_count, bg: inventory.low_stock_count > 0 ? '#ffebee' : '#e8f5e9', color: inventory.low_stock_count > 0 ? '#c62828' : '#2e7d32' },
                            { label: 'Out of Stock', value: inventory.out_of_stock_count, bg: inventory.out_of_stock_count > 0 ? '#ffebee' : '#f5f5f5', color: inventory.out_of_stock_count > 0 ? '#c62828' : '#888' },
                        ].map(r => (
                            <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', backgroundColor: r.bg, borderRadius: 8, color: r.color }}>
                                <span>{r.label}</span><strong>{r.value}</strong>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <div className="chart-container" style={{ padding: 20 }}>
                <h3 style={{ marginBottom: 16, color: '#5D4E37' }}>Top Products by Sales</h3>
                {top_products?.length > 0 ? (
                    <ResponsiveContainer width="100%" height={240}>
                        <BarChart data={top_products} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" allowDecimals={false} />
                            <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 11 }} />
                            <Tooltip />
                            <Bar dataKey="qty_sold" fill="#5D4E37" name="Qty Sold" />
                        </BarChart>
                    </ResponsiveContainer>
                ) : <p style={{ color: '#888', textAlign: 'center' }}>No product sales data</p>}
            </div>
        </div>
    );
};

const PatientsTab = ({ data }) => {
    if (!data) return <div className="dashboard-loading"><div className="spinner" /></div>;
    const { summary, registration_trend, interaction_table } = data;

    return (
        <div>
            <div className="stats-grid" style={{ marginBottom: 24 }}>
                <StatCard icon={<FaUsers />} label="Total Registered" value={summary.total_clients} color="#1565c0" />
                <StatCard icon={<FaUserMd />} label="Active This Period" value={summary.active_clients} color="#2e7d32" />
                <StatCard icon={<FaUsers />} label="New This Month" value={summary.new_this_month} color="#ef6c00" />
            </div>
            <div className="chart-container" style={{ padding: 20, marginBottom: 24 }}>
                <h3 style={{ marginBottom: 16, color: '#5D4E37' }}>Client Registrations (Last 6 Months)</h3>
                {registration_trend?.length > 0 ? (
                    <ResponsiveContainer width="100%" height={240}>
                        <AreaChart data={registration_trend}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                            <YAxis allowDecimals={false} />
                            <Tooltip />
                            <Area type="monotone" dataKey="registrations" stroke="#5D4E37" fill="#D7CCC8" name="Registrations" />
                        </AreaChart>
                    </ResponsiveContainer>
                ) : <p style={{ color: '#888', textAlign: 'center' }}>No data</p>}
            </div>
            <div className="chart-container" style={{ padding: 20 }}>
                <h3 style={{ marginBottom: 16, color: '#5D4E37' }}>Patient Interaction Report</h3>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                        <thead>
                            <tr style={{ backgroundColor: '#faf8f5', borderBottom: '2px solid #E0D5C7' }}>
                                {['Name', 'Email', 'Appointments', 'Reservations', 'Total Spent', 'Last Appt'].map(h => (
                                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', color: '#5D4E37', fontWeight: 700 }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {interaction_table?.length === 0
                                ? <tr><td colSpan={6} style={{ padding: 30, textAlign: 'center', color: '#888' }}>No data</td></tr>
                                : interaction_table?.map((p, i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid #f0ebe5', backgroundColor: i % 2 === 0 ? 'white' : '#fdfcfa' }}>
                                        <td style={{ padding: '10px 16px', fontWeight: 600 }}>{p.name}</td>
                                        <td style={{ padding: '10px 16px', color: '#666' }}>{p.email}</td>
                                        <td style={{ padding: '10px 16px', textAlign: 'center' }}><span style={{ background: '#e8f5e9', color: '#2e7d32', padding: '2px 10px', borderRadius: 12, fontWeight: 600 }}>{p.appointments}</span></td>
                                        <td style={{ padding: '10px 16px', textAlign: 'center' }}><span style={{ background: '#e3f2fd', color: '#1565c0', padding: '2px 10px', borderRadius: 12, fontWeight: 600 }}>{p.reservations}</span></td>
                                        <td style={{ padding: '10px 16px', color: '#2e7d32', fontWeight: 600 }}>{formatCurrency(p.total_spent)}</td>
                                        <td style={{ padding: '10px 16px', color: '#888', fontSize: 12 }}>{p.last_appointment || '—'}</td>
                                    </tr>
                                ))
                            }
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const PredictionsTab = ({ data }) => {
    if (!data) return <div className="dashboard-loading"><div className="spinner" /></div>;
    const { appointment_forecast, service_demand, inventory_alerts, patient_return, generated_at, engine } = data;

    const demandColors = { High: '#2e7d32', Medium: '#ef6c00', Low: '#c62828' };
    const engineLabel  = engine === 'tensorflow' ? '🧠 TensorFlow 2.21' : '🌲 Random Forest (PHP)';
    const engineColor  = engine === 'tensorflow' ? '#1565c0' : '#5D4E37';
    const genTime      = generated_at ? new Date(generated_at).toLocaleString('en-PH') : '—';

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <span style={{ padding: '4px 14px', borderRadius: 20, backgroundColor: engineColor + '18', color: engineColor, fontWeight: 700, fontSize: 12 }}>{engineLabel}</span>
                <span style={{ fontSize: 11, color: '#aaa' }}>Generated: {genTime} · Cached for 30 min</span>
            </div>

            {/* Appointment Forecast */}
            <div className="chart-container" style={{ padding: 20, marginBottom: 24 }}>
                <h3 style={{ marginBottom: 4, color: '#5D4E37' }}><FaChartLine style={{ marginRight: 8 }} />Appointment Demand Forecast (Next 14 Days)</h3>
                <p style={{ fontSize: 12, color: '#888', marginBottom: 16 }}>
                    Predicted next 30 days: <strong>{appointment_forecast?.next_30_days}</strong> appointments ·
                    Confidence: <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{appointment_forecast?.confidence}</span>
                </p>
                {appointment_forecast?.daily_breakdown?.length > 0 ? (
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={appointment_forecast.daily_breakdown}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={d => d.slice(5)} />
                            <YAxis allowDecimals={false} />
                            <Tooltip />
                            <Bar dataKey="predicted" fill="#5D4E37" name="Predicted Appointments" />
                        </BarChart>
                    </ResponsiveContainer>
                ) : <p style={{ color: '#888', textAlign: 'center' }}>Insufficient historical data for forecast</p>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
                {/* Service Demand */}
                <div className="chart-container" style={{ padding: 20 }}>
                    <h3 style={{ marginBottom: 16, color: '#5D4E37' }}>Service Demand Classification</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {service_demand?.map((s, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', backgroundColor: '#fafafa', borderRadius: 8 }}>
                                <span style={{ fontSize: 13 }}>{s.service}</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <span style={{ fontSize: 12, color: '#888' }}>{s.times_availed} bookings</span>
                                    <span style={{ padding: '3px 12px', borderRadius: 20, backgroundColor: demandColors[s.demand_level] + '22', color: demandColors[s.demand_level], fontWeight: 700, fontSize: 12 }}>{s.demand_level}</span>
                                </div>
                            </div>
                        ))}
                        {!service_demand?.length && <p style={{ color: '#888' }}>No service data</p>}
                    </div>
                </div>

                {/* Patient Return */}
                <div className="chart-container" style={{ padding: 20 }}>
                    <h3 style={{ marginBottom: 16, color: '#5D4E37' }}>Patient Return Likelihood</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                        {[
                            { label: 'Likely to Return', value: patient_return?.likely_count, color: '#2e7d32' },
                            { label: 'Neutral', value: patient_return?.neutral_count, color: '#ef6c00' },
                            { label: 'At Risk (may churn)', value: patient_return?.at_risk_count, color: '#c62828' },
                        ].map(r => (
                            <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', backgroundColor: r.color + '11', borderRadius: 8 }}>
                                <span style={{ color: r.color, fontWeight: 600 }}>{r.label}</span>
                                <strong style={{ color: r.color }}>{r.value}</strong>
                            </div>
                        ))}
                    </div>
                    {patient_return?.at_risk_list?.length > 0 && (
                        <div>
                            <p style={{ fontSize: 12, fontWeight: 600, color: '#c62828', marginBottom: 8 }}><FaExclamationTriangle style={{ marginRight: 4 }} />At-Risk Patients</p>
                            {patient_return.at_risk_list.slice(0, 5).map((p, i) => (
                                <div key={i} style={{ fontSize: 12, padding: '4px 0', color: '#555' }}>{p.name} — {p.days_since_last} days since last visit</div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Inventory Alerts */}
            <div className="chart-container" style={{ padding: 20 }}>
                <h3 style={{ marginBottom: 16, color: '#5D4E37' }}><FaExclamationTriangle style={{ marginRight: 8, color: '#ef6c00' }} />Inventory Depletion Forecast</h3>
                {inventory_alerts?.length === 0
                    ? <p style={{ color: '#2e7d32' }}>✅ All products have sufficient stock for the next 2 weeks.</p>
                    : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#faf8f5', borderBottom: '2px solid #E0D5C7' }}>
                                        {['Product', 'Category', 'Stock', 'Avg Daily Sales', 'Days Remaining', 'Status'].map(h => (
                                            <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: '#5D4E37', fontWeight: 700 }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {inventory_alerts?.map((p, i) => (
                                        <tr key={i} style={{ borderBottom: '1px solid #f0ebe5' }}>
                                            <td style={{ padding: '10px 14px', fontWeight: 600 }}>{p.product}</td>
                                            <td style={{ padding: '10px 14px', color: '#666' }}>{p.category}</td>
                                            <td style={{ padding: '10px 14px' }}>{p.current_stock}</td>
                                            <td style={{ padding: '10px 14px' }}>{p.avg_daily_sales}/day</td>
                                            <td style={{ padding: '10px 14px', fontWeight: 700, color: p.alert ? '#c62828' : '#ef6c00' }}>{p.days_remaining} days</td>
                                            <td style={{ padding: '10px 14px' }}>
                                                <span style={{ padding: '3px 12px', borderRadius: 20, backgroundColor: p.alert ? '#ffebee' : '#fff3e0', color: p.alert ? '#c62828' : '#ef6c00', fontWeight: 700, fontSize: 12 }}>
                                                    {p.alert ? '🔴 Critical' : '🟡 Warning'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )
                }
            </div>
        </div>
    );
};

const AIInsightsPanel = ({ insights, loading, onRefresh }) => (
    <div className="chart-container" style={{ padding: 20, marginBottom: 24, borderLeft: '4px solid #5D4E37', background: 'linear-gradient(135deg, #faf8f5 0%, #f0ebe5 100%)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ color: '#5D4E37', margin: 0 }}><FaBrain style={{ marginRight: 8 }} />AI-Generated Insights</h3>
            <button onClick={onRefresh} style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #8B7355', backgroundColor: 'white', color: '#5D4E37', cursor: 'pointer', fontWeight: 600, fontSize: 12 }}>↻ Refresh</button>
        </div>
        {loading
            ? <p style={{ color: '#888', fontStyle: 'italic' }}>Generating AI insights...</p>
            : <p style={{ lineHeight: 1.8, color: '#3E2723', whiteSpace: 'pre-line', fontSize: 14 }}>{insights || 'No insights available for the selected period.'}</p>
        }
        <p style={{ fontSize: 10, color: '#aaa', marginTop: 8 }}>Powered by GPT-4o · Cached for 15 min</p>
    </div>
);

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

const AdminReports = ({ initialTab }) => {
    const [activeTab, setActiveTab] = useState(initialTab || 'appointments');
    const [dateFrom, setDateFrom] = useState(() => {
        const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().split('T')[0];
    });
    const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);

    const [tabData, setTabData] = useState({});
    const [loadingTab, setLoadingTab] = useState(false);
    const [predictions, setPredictions] = useState(null);
    const [loadingPredictions, setLoadingPredictions] = useState(false);
    const [insights, setInsights] = useState('');
    const [loadingInsights, setLoadingInsights] = useState(false);

    const fetchTab = useCallback(async (tab, from, to) => {
        setLoadingTab(true);
        try {
            const query = new URLSearchParams({ date_from: from, date_to: to }).toString();
            const res = await api.get(`/reports/${tab}?${query}`);
            setTabData(prev => ({ ...prev, [tab]: res.data?.data || res.data }));
        } catch (e) {
            console.error(`Reports/${tab}:`, e);
        } finally {
            setLoadingTab(false);
        }
    }, []);

    const fetchPredictions = useCallback(async () => {
        setLoadingPredictions(true);
        try {
            const res = await api.get('/reports/predictions');
            setPredictions(res.data?.data || res.data);
        } catch (e) {
            console.error('Reports/predictions:', e);
        } finally {
            setLoadingPredictions(false);
        }
    }, []);

    const fetchInsights = useCallback(async (from, to) => {
        setLoadingInsights(true);
        try {
            const query = new URLSearchParams({ date_from: from, date_to: to }).toString();
            const res = await api.get(`/reports/ai-insights?${query}`);
            setInsights(res.data?.data?.insights || '');
        } catch (e) {
            console.error('Reports/ai-insights:', e);
        } finally {
            setLoadingInsights(false);
        }
    }, []);

    // On tab change or date change: fetch the tab data + insights
    useEffect(() => {
        if (activeTab === 'predictions') {
            if (!predictions) fetchPredictions();
        } else {
            fetchTab(activeTab, dateFrom, dateTo);
            fetchInsights(dateFrom, dateTo);
        }
    }, [activeTab, dateFrom, dateTo]);

    useEffect(() => { if (initialTab) setActiveTab(initialTab); }, [initialTab]);

    const setPreset = (preset) => {
        const now = new Date(), to = now.toISOString().split('T')[0];
        let from;
        if (preset === 'week')  { const d = new Date(now); d.setDate(d.getDate() - 7);        from = d.toISOString().split('T')[0]; }
        if (preset === 'month') { const d = new Date(now); d.setMonth(d.getMonth() - 1);      from = d.toISOString().split('T')[0]; }
        if (preset === 'year')  { const d = new Date(now); d.setFullYear(d.getFullYear() - 1); from = d.toISOString().split('T')[0]; }
        setDateFrom(from); setDateTo(to);
    };

    const tabs = [
        { key: 'appointments', label: 'Appointments' },
        { key: 'services',     label: 'Services' },
        { key: 'sales',        label: 'Sales & Inventory' },
        { key: 'patients',     label: 'Patients' },
        { key: 'predictions',  label: '🤖 AI Predictions' },
    ];

    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <h1>Reports & Analytics</h1>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    {activeTab !== 'predictions' && (
                        <>
                            <label style={{ fontSize: 13, color: '#5D4E37', fontWeight: 600 }}>From</label>
                            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                                style={{ padding: '7px 10px', borderRadius: 6, border: '1px solid #E0D5C7', fontSize: 13 }} />
                            <label style={{ fontSize: 13, color: '#5D4E37', fontWeight: 600 }}>To</label>
                            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                                style={{ padding: '7px 10px', borderRadius: 6, border: '1px solid #E0D5C7', fontSize: 13 }} />
                            {['week', 'month', 'year'].map(p => (
                                <button key={p} onClick={() => setPreset(p)}
                                    style={{ padding: '7px 12px', borderRadius: 6, border: '1px solid #E0D5C7', backgroundColor: 'white', cursor: 'pointer', fontSize: 12, color: '#5D4E37', fontWeight: 600 }}>
                                    {p.charAt(0).toUpperCase() + p.slice(1)}
                                </button>
                            ))}
                        </>
                    )}
                </div>
            </div>

            {/* Tab Navigation */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
                {tabs.map(tab => (
                    <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                        style={{ padding: '10px 20px', borderRadius: 8, border: activeTab === tab.key ? 'none' : '1px solid #E0D5C7', backgroundColor: activeTab === tab.key ? '#5D4E37' : 'white', color: activeTab === tab.key ? 'white' : '#5D4E37', cursor: 'pointer', fontWeight: 600, fontFamily: 'Calibri' }}>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* AI Insights Panel (shown on all tabs except predictions) */}
            {activeTab !== 'predictions' && (
                <AIInsightsPanel
                    insights={insights}
                    loading={loadingInsights}
                    onRefresh={() => fetchInsights(dateFrom, dateTo)}
                />
            )}

            {/* Tab Content */}
            {loadingTab && activeTab !== 'predictions'
                ? <div className="dashboard-loading"><div className="spinner" /></div>
                : (
                    <div className="tab-content">
                        {activeTab === 'appointments' && <AppointmentsTab data={tabData['appointments']} />}
                        {activeTab === 'services'     && <ServicesTab     data={tabData['services']} />}
                        {activeTab === 'sales'        && <SalesTab        data={tabData['sales']} />}
                        {activeTab === 'patients'     && <PatientsTab     data={tabData['patients']} />}
                        {activeTab === 'predictions'  && (
                            loadingPredictions
                                ? <div className="dashboard-loading"><div className="spinner" /><p>Running Random Forest predictions...</p></div>
                                : <PredictionsTab data={predictions} />
                        )}
                    </div>
                )
            }
        </div>
    );
};

export default AdminReports;
