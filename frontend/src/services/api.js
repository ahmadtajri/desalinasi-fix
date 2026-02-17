import axios from 'axios';

// Automatically detect the correct API URL based on environment
// Production: Use relative /api path (goes through Nginx reverse proxy on port 80/443)
// Development: Use localhost:3000 directly
const getApiBaseUrl = () => {
    const hostname = window.location.hostname;
    const port = window.location.port;
    const protocol = window.location.protocol;

    // Development mode: Vite dev server on port 5173 or similar dev ports
    const isDev = port === '5173' || port === '5174' || hostname === 'localhost' && port !== '80' && port !== '443' && port !== '';

    if (isDev) {
        // In development, connect directly to backend on port 3000
        return `http://${hostname}:3000/api`;
    }

    // Production: Use relative path (same origin, goes through Nginx reverse proxy)
    // This ensures all requests go through Nginx (:80) → proxy to backend (:3000)
    // Benefits: Security headers, rate limiting, no exposed backend port
    return `${protocol}//${hostname}${port ? ':' + port : ''}/api`;
};

const api = axios.create({
    baseURL: getApiBaseUrl(),
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000, // 10 second timeout
});

// Add request interceptor to include JWT token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('iot_access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        console.log(`📡 API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
    },
    (error) => {
        console.error('❌ Request Error:', error);
        return Promise.reject(error);
    }
);

// Add response interceptor for better error handling
api.interceptors.response.use(
    (response) => {
        console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url} - Status: ${response.status}`);
        return response;
    },
    (error) => {
        if (error.code === 'ECONNABORTED') {
            console.error('⏱️ Request Timeout:', error.config?.url);
            error.message = 'Request timeout - Backend mungkin tidak merespons';
        } else if (error.code === 'ERR_NETWORK') {
            console.error('🌐 Network Error:', error.config?.url);
            error.message = 'Tidak dapat terhubung ke backend. Pastikan backend berjalan di port 3000';
        } else if (error.response) {
            console.error(`❌ API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url} - Status: ${error.response.status}`, error.response.data);
        } else {
            console.error('❌ Unknown Error:', error.message);
        }
        return Promise.reject(error);
    }
);

// Log the API URL for debugging
console.log('🔗 API Base URL:', api.defaults.baseURL);

export default api;
