import axios from 'axios';
import API_CONFIG from '../config/api.config';
import Cookies from 'js-cookie';

// Create axios instance
const api = axios.create({
    baseURL: API_CONFIG.BASE_URL,
    timeout: API_CONFIG.TIMEOUT,
    headers: API_CONFIG.HEADERS,
});

// REQUEST INTERCEPTOR - Add token to every request
api.interceptors.request.use(
    (config) => {
        // Check for admin token first, then doctor, then client
        const token = Cookies.get('auth_token') || Cookies.get('doctor_token') || Cookies.get('client_token');

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// RESPONSE INTERCEPTOR - Handle errors globally
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response) {
            switch (error.response.status) {
                case 401:
                    // Unauthorized - Clear cookies and redirect to login
                    Cookies.remove('auth_token');
                    Cookies.remove('user_data');
                    window.location.href = '/admin/login';
                    break;
                case 403:
                    console.error('Forbidden - Access denied');
                    break;
                case 404:
                    console.error('Resource not found');
                    break;
                case 422:
                    // Validation error - handled by calling function
                    break;
                case 500:
                    console.error('Server error - Please try again later');
                    break;
            }
        }

        return Promise.reject(error);
    }
);

// API Endpoints
export const productsAPI = {
    getAll: () => api.get('/products'),
};

export const authAPI = {
    login: (credentials) => api.post('/admin/auth/login', credentials),
    register: (userData) => api.post('/admin/auth/register', userData),
    logout: () => api.post('/admin/auth/logout'),
    me: () => api.get('/admin/auth/me'),
    updateProfile: (data) => api.put('/admin/auth/profile', data),
};

export const adminAPI = {
    // Dashboard Stats - Single optimized endpoint
    getDashboardAll: () => api.get('/dashboard/all'),
    // Legacy individual endpoints (kept for granular updates)
    getStats: () => api.get('/dashboard/stats'),
    getProductDistribution: (filter) => api.get(`/dashboard/products-distribution?filter=${filter}`),
    getReservationTrends: (filter) => api.get(`/dashboard/reservation-trends?filter=${filter}`),
    getAppointmentTrends: (filter) => api.get(`/dashboard/appointment-trends?filter=${filter}`),

    getReservations: () => api.get('/reservations'),
    updateReservationStatus: (id, status) => api.put(`/reservations/${id}/status`, { status }),

    // Appointment Management
    getAppointments: () => api.get('/appointments'),
    createAppointment: (appointmentData) => api.post('/appointments', appointmentData),
    updateAppointment: (id, appointmentData) => api.put(`/appointments/${id}`, appointmentData),
    deleteAppointment: (id) => api.delete(`/appointments/${id}`),

    // Service Management
    getServices: () => api.get('/services'),
    createService: (serviceData) => api.post('/services', serviceData),
    updateService: (id, serviceData) => api.put(`/services/${id}`, serviceData),
    deleteService: (id) => api.delete(`/services/${id}`),
    getServicesWithStats: () => api.get('/services/with-stats'),

    // Doctor Management
    getDoctors: () => api.get('/doctors'),
    createDoctor: (doctorData) => api.post('/doctors', doctorData),
    getDoctorAppointments: (id) => api.get(`/doctors/${id}/appointments`),
    updateDoctor: (id, doctorData) => api.post(`/doctors/${id}`, doctorData), // POST for FormData
    deleteDoctor: (id) => api.delete(`/doctors/${id}`),

    // Doctor Schedule Management
    getDoctorSchedules: (doctorId) => api.get(`/doctors/${doctorId}/schedules`),
    getAvailableSlots: (doctorId, date) => api.get(`/doctors/${doctorId}/available-slots?date=${date}`),
    getAllSchedules: () => api.get('/doctor-schedules'),
    createDoctorSchedule: (scheduleData) => api.post('/doctor-schedules', scheduleData),
    updateDoctorSchedule: (id, scheduleData) => api.put(`/doctor-schedules/${id}`, scheduleData),
    deleteDoctorSchedule: (id) => api.delete(`/doctor-schedules/${id}`),

    // Patient Management
    getPatients: () => api.get('/patients'),
    getPatient: (id) => api.get(`/patients/${id}`),
    getRecords: () => api.get('/patients'), // Alias for AdminRecords.jsx
    createPatient: (patientData) => api.post('/patients', patientData),
    updatePatient: (id, patientData) => api.put(`/patients/${id}`, patientData),
    deletePatient: (id) => api.delete(`/patients/${id}`),

    // Product Management
    getProducts: () => api.get('/products'),
    addProduct: (productData) => api.post('/products', productData),
    createProduct: (productData) => api.post('/products', productData),
    updateProduct: (id, productData) => api.post(`/products/${id}`, productData), // POST for FormData
    deleteProduct: (id) => api.delete(`/products/${id}`),

    // Reservation Management
    getReservations: () => api.get('/reservations'),
    updateReservationStatus: (id, status) => api.put(`/reservations/${id}/status`, { status }),

    // Client Management
    getClients: () => api.get('/clients'),
    getClient: (id) => api.get(`/clients/${id}`),
    blockClient: (id) => api.put(`/clients/${id}/block`),

    // Customer Management
    getCustomers: () => api.get('/customers'),
    getCustomer: (id) => api.get(`/customers/${id}`),
    createCustomer: (customerData) => api.post('/customers', customerData),

    // Appointment Management
    getDoctorAppointments: (doctorId) => api.get(`/appointments/doctor/${doctorId}`),
    getAppointments: () => api.get('/appointments'),
    updateAppointmentStatus: (id, status) => api.put(`/appointments/${id}/status`, { status }),

    // Sales Transaction Management (POS)
    createTransaction: (transactionData) => api.post('/sales/transactions', transactionData),
    getTransactions: (filter = '', search = '') => api.get(`/sales/transactions?filter=${filter}&search=${search}`),
    getTransaction: (id) => api.get(`/sales/transactions/${id}`),

    // POS Notifications
    getPosNotifications: () => api.get('/pos-notifications'),
    markPosNotificationAsRead: (id) => api.put(`/pos-notifications/${id}/read`),

    // Inventory Analytics
    getInventoryAnalytics: () => api.get('/inventory/analytics'),

    // Low Stock Alerts
    getLowStockAlerts: (threshold = 10) => api.get(`/low-stock-alerts?threshold=${threshold}`),

    // Staff Management
    getStaffAccounts: () => api.get('/admin/staff'),
    createStaffAccount: (data) => api.post('/admin/staff', data),
    deleteStaffAccount: (id) => api.delete(`/admin/staff/${id}`),
    getRoles: () => api.get('/roles'),

    // QR Code Management
    getGcashQr: () => api.get('/qr-codes/gcash'),
    saveGcashQr: (qrData) => api.post('/qr-codes/gcash', qrData),

    // Site Settings (read-only)
    getSiteSettings: () => api.get('/site-settings'),

    // Reports & Analytics (AI-powered backend-driven)
    getReport: (tab, params = {}) => {
        const query = new URLSearchParams(params).toString();
        return api.get(`/reports/${tab}${query ? '?' + query : ''}`);
    },
    getReportPredictions: () => api.get('/reports/predictions'),
    getReportInsights: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return api.get(`/reports/ai-insights${query ? '?' + query : ''}`);
    },
};

export default api;
