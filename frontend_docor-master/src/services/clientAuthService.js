import axios from 'axios';
import API_CONFIG from '../config/api.config';
import Cookies from 'js-cookie';

// Create axios instance
const api = axios.create({
    baseURL: API_CONFIG.BASE_URL,
    timeout: API_CONFIG.TIMEOUT,
    headers: API_CONFIG.HEADERS
});

const CLIENT_TOKEN_KEY = 'client_token';
const CLIENT_USER_KEY = 'client_user';

const clientAuthService = {
    /**
     * Register a new client
     */
    async register(userData) {
        try {
            const response = await api.post('/client/register', {
                first_name: userData.first_name || userData.firstName,
                last_name: userData.last_name || userData.lastName,
                email: userData.email,
                password: userData.password,
                password_confirmation: userData.confirmPassword || userData.password_confirmation,
                phone: userData.phone,
                gender: userData.gender
            });

            if (response.data.status === 'success') {
                // If email verification is required, don't store token yet
                if (response.data.email_verified === false) {
                    return response.data;
                }
                // If email is already verified (shouldn't happen for new registrations)
                if (response.data.data?.token) {
                    this.storeClient(response.data.data.client, response.data.data.token);
                }
                return response.data;
            }

            return response.data;
        } catch (error) {
            if (error.response?.data) {
                throw error.response.data;
            }
            throw { status: 'error', message: error.message };
        }
    },

    /**
     * Verify email OTP after registration
     */
    async verifyEmailOtp(email, otp) {
        try {
            const response = await api.post('/email/verify-otp', { email, otp });

            if (response.data.status === 'success' && response.data.data?.token) {
                this.storeClient(response.data.data.client, response.data.data.token);
            }

            return response.data;
        } catch (error) {
            if (error.response?.data) {
                throw error.response.data;
            }
            throw { status: 'error', message: error.message };
        }
    },

    /**
     * Resend email verification OTP
     */
    async resendEmailOtp(email) {
        try {
            const response = await api.post('/email/send-otp', { email });
            return response.data;
        } catch (error) {
            if (error.response?.data) {
                throw error.response.data;
            }
            throw { status: 'error', message: error.message };
        }
    },

    /**
     * Login a client
     */
    async login(email, password) {
        try {
            const response = await api.post('/client/login', {
                email,
                password
            });

            if (response.data.status === 'success') {
                // Store token and user data
                this.storeClient(response.data.data.client, response.data.data.token);
                return response.data;
            }

            return response.data;
        } catch (error) {
            if (error.response?.data) {
                throw error.response.data;
            }
            throw { status: 'error', message: error.message };
        }
    },

    /**
     * Unified login - checks both client and admin tables
     * Token storage is handled by AuthProvider based on user_type
     */
    async unifiedLogin(email, password) {
        try {
            const response = await api.post('/auth/login', {
                email,
                password
            });

            return response.data;
        } catch (error) {
            if (error.response?.data) {
                throw error.response.data;
            }
            throw { status: 'error', message: error.message };
        }
    },

    /**
     * Logout the client
     */
    async logout() {
        try {
            const token = this.getToken();
            if (token) {
                await api.post('/client/logout', {}, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            this.clearClient();
        }
    },

    /**
     * Get current client data
     */
    async getCurrentClient() {
        try {
            const token = this.getToken();
            if (!token) return null;

            const response = await api.get('/client/me', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.data.status === 'success') {
                return response.data.data.client;
            }

            return null;
        } catch (error) {
            console.error('Get current client error:', error);
            this.clearClient();
            return null;
        }
    },

    /**
     * Store client data and token
     */
    storeClient(client, token) {
        Cookies.set(CLIENT_TOKEN_KEY, token, { expires: 7 }); // 7 days
        Cookies.set(CLIENT_USER_KEY, JSON.stringify(client), { expires: 7 });
    },

    /**
     * Get stored client
     */
    getStoredClient() {
        const clientData = Cookies.get(CLIENT_USER_KEY);
        return clientData ? JSON.parse(clientData) : null;
    },

    /**
     * Get stored token
     */
    getToken() {
        return Cookies.get(CLIENT_TOKEN_KEY);
    },

    /**
     * Clear client data
     */
    clearClient() {
        Cookies.remove(CLIENT_TOKEN_KEY);
        Cookies.remove(CLIENT_USER_KEY);
    },

    /**
     * Check if client is authenticated
     */
    isAuthenticated() {
        return !!this.getToken();
    },

    /**
     * Get client's product reservations
     */
    async getReservations() {
        try {
            const token = this.getToken();
            if (!token) {
                throw { status: 'error', message: 'Not authenticated' };
            }

            const response = await api.get('/client/reservations', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.data.status === 'success') {
                return response.data.data;
            }

            return [];
        } catch (error) {
            console.error('Get reservations error:', error);
            if (error.response?.data) {
                throw error.response.data;
            }
            throw { status: 'error', message: error.message };
        }
    },

    /**
     * Reserve a product
     */
    async reserveProduct(productId, reservationData = {}) {
        try {
            const token = this.getToken();
            if (!token) {
                throw { status: 'error', message: 'Not authenticated' };
            }

            const response = await api.post('/client/reservations', {
                product_id: productId,
                pickup_date: reservationData.pickup_date,
                payment_mode: reservationData.payment_mode,
                message: reservationData.message || ''
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            return response.data;
        } catch (error) {
            console.error('Reserve product error:', error);
            if (error.response?.data) {
                throw error.response.data;
            }
            throw { status: 'error', message: error.message };
        }
    },

    /**
     * Delete a reservation
     */
    async deleteReservation(id) {
        try {
            const token = this.getToken();
            if (!token) {
                throw { status: 'error', message: 'Not authenticated' };
            }

            const response = await api.delete(`/client/reservations/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            return response.data;
        } catch (error) {
            console.error('Delete reservation error:', error);
            if (error.response?.data) {
                throw error.response.data;
            }
            throw { status: 'error', message: error.message };
        }
    },

    /**
     * Get client's appointments
     */
    async getAppointments() {
        try {
            const token = this.getToken();
            if (!token) {
                throw { status: 'error', message: 'Not authenticated' };
            }

            const response = await api.get('/client/appointments', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.data.status === 'success') {
                return response.data.data;
            }

            return [];
        } catch (error) {
            console.error('Get appointments error:', error);
            if (error.response?.data) {
                throw error.response.data;
            }
            throw { status: 'error', message: error.message };
        }
    },

    /**
     * Create a new appointment
     */
    async createAppointment(appointmentData) {
        try {
            const token = this.getToken();
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await api.post('/client/appointments', appointmentData, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            return response.data;
        } catch (error) {
            console.error('Create appointment error:', error);
            throw error;
        }
    },

    /**
     * Reschedule pickup date for a reservation
     */
    async reschedulePickup(reservationId, pickupDate) {
        try {
            const token = this.getToken();
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await api.put(`/client/reservations/${reservationId}/reschedule`, {
                pickup_date: pickupDate
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            return response.data;
        } catch (error) {
            console.error('Reschedule pickup error:', error);
            throw error;
        }
    },

    /**
     * Cancel a reservation
     */
    async cancelReservation(reservationId) {
        try {
            const token = this.getToken();
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await api.delete(`/client/reservations/${reservationId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            return response.data;
        } catch (error) {
            console.error('Cancel reservation error:', error);
            throw error;
        }
    },

    /**
     * Reschedule an appointment
     */
    async rescheduleAppointment(appointmentId, rescheduleData) {
        try {
            const token = this.getToken();
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await api.put(`/client/appointments/${appointmentId}/reschedule`, {
                appointment_date: rescheduleData.date,
                appointment_time: rescheduleData.time
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            return response.data;
        } catch (error) {
            console.error('Reschedule appointment error:', error);
            throw error;
        }
    },

    /**
     * Cancel an appointment
     */
    async cancelAppointment(appointmentId) {
        try {
            const token = this.getToken();
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await api.put(`/client/appointments/${appointmentId}/cancel`, {}, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            return response.data;
        } catch (error) {
            console.error('Cancel appointment error:', error);
            throw error;
        }
    },
};

export default clientAuthService;

