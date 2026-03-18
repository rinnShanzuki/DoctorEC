import api from './api';
import Cookies from 'js-cookie';

class AdminAuthService {
    /**
     * Register new admin
     * @param {Object} data - Registration data
     * @returns {Promise}
     */
    async register(data) {
        try {
            const response = await api.post('/admin/auth/register', data);

            if (response.data.data.token) {
                // Store token and admin data in cookies (expires in 7 days)
                Cookies.set('auth_token', response.data.data.token, { expires: 7 });
                Cookies.set('user_data', JSON.stringify(response.data.data.admin), { expires: 7 });
            }

            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    }

    /**
     * Login admin
     * @param {string} email 
     * @param {string} password 
     * @returns {Promise}
     */
    async login(email, password) {
        try {
            const response = await api.post('/admin/auth/login', { email, password });

            if (response.data.data.token) {
                // Store token and admin data in cookies (expires in 7 days)
                Cookies.set('auth_token', response.data.data.token, { expires: 7 });
                Cookies.set('user_data', JSON.stringify(response.data.data.admin), { expires: 7 });
            }

            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    }

    /**
     * Logout admin
     * @returns {Promise}
     */
    async logout() {
        try {
            // Call logout API to revoke token on server
            await api.post('/admin/auth/logout');
        } catch (error) {
            console.error('Logout API error:', error);
        } finally {
            // Always clear cookies regardless of API call success
            Cookies.remove('auth_token');
            Cookies.remove('user_data');
        }
    }

    /**
     * Get current admin profile
     * @returns {Promise}
     */
    async me() {
        try {
            const response = await api.get('/admin/auth/me');

            // Update stored user data
            if (response.data.data.admin) {
                Cookies.set('user_data', JSON.stringify(response.data.data.admin), { expires: 7 });
            }

            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    }

    /**
     * Update admin profile
     * @param {Object} data - Profile data to update
     * @returns {Promise}
     */
    async updateProfile(data) {
        try {
            const response = await api.put('/admin/auth/profile', data);

            // Update stored user data
            if (response.data.data.admin) {
                Cookies.set('user_data', JSON.stringify(response.data.data.admin), { expires: 7 });
            }

            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    }

    /**
     * Check if user is authenticated
     * @returns {boolean}
     */
    isAuthenticated() {
        return !!Cookies.get('auth_token');
    }

    /**
     * Get stored admin data from cookies
     * @returns {Object|null}
     */
    getStoredAdmin() {
        try {
            const userData = Cookies.get('user_data');
            return userData ? JSON.parse(userData) : null;
        } catch (error) {
            console.error('Error parsing stored admin data:', error);
            return null;
        }
    }

    /**
     * Get stored auth token
     * @returns {string|null}
     */
    getToken() {
        return Cookies.get('auth_token') || null;
    }
}

export default new AdminAuthService();
