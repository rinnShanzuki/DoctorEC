const API_CONFIG = {
    BASE_URL: 'http://localhost:8000/api/v1',
    TIMEOUT: 30000, // 30 seconds
    HEADERS: {
        'Accept': 'application/json',
        // Don't set Content-Type - let axios auto-detect for FormData
    },
};

export default API_CONFIG;
