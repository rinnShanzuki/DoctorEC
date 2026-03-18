import api from './api';
import Cookies from 'js-cookie';

class DoctorAuthService {
    /**
     * Login doctor
     */
    async login(email, password) {
        try {
            const response = await api.post('/doctor/auth/login', { email, password });

            if (response.data.data.token) {
                Cookies.set('doctor_token', response.data.data.token, { expires: 7 });
                Cookies.set('doctor_data', JSON.stringify(response.data.data.doctor), { expires: 7 });
            }

            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    }

    /**
     * Logout doctor
     */
    async logout() {
        try {
            await api.post('/doctor/auth/logout');
        } catch (error) {
            console.error('Doctor logout API error:', error);
        } finally {
            Cookies.remove('doctor_token');
            Cookies.remove('doctor_data');
        }
    }

    /**
     * Get current doctor profile
     */
    async me() {
        try {
            const response = await api.get('/doctor/auth/me');
            if (response.data.data.doctor) {
                Cookies.set('doctor_data', JSON.stringify(response.data.data.doctor), { expires: 7 });
            }
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    }

    /**
     * Check if doctor is authenticated
     */
    isAuthenticated() {
        return !!Cookies.get('doctor_token');
    }

    /**
     * Get stored doctor data
     */
    getStoredDoctor() {
        try {
            const data = Cookies.get('doctor_data');
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Error parsing doctor data:', error);
            return null;
        }
    }

    /**
     * Get stored doctor token
     */
    getToken() {
        return Cookies.get('doctor_token') || null;
    }
}

export default new DoctorAuthService();
