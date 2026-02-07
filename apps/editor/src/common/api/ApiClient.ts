import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const api = axios.create({
    baseURL: API_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    }
});

// Interceptor for token (if using localStorage based auth)
api.interceptors.request.use(config => {
    const token = localStorage.getItem('auth_token');
    console.log('[ApiClient] Request interceptor', { 
        url: config.url, 
        hasToken: !!token,
        tokenPreview: token ? token.substring(0, 20) + '...' : null
    });
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Global Error Handler
api.interceptors.response.use(
    response => response,
    error => {
        console.error('[ApiClient] Response error', {
            status: error.response?.status,
            url: error.config?.url,
            message: error.message
        });
        
        if (error.response?.status === 401) {
            console.warn('[ApiClient] 401 Unauthorized - Clearing auth and redirecting to login');
            localStorage.removeItem('auth_token');
            
            // Force redirect to login
            if (!window.location.pathname.includes('/login')) {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export const ApiClient = {
    get: <T = any>(url: string, params?: any) => api.get<T>(url, { params }),
    post: <T = any>(url: string, data?: any, config?: any) => api.post<T>(url, data, config),
    put: <T = any>(url: string, data?: any, config?: any) => api.put<T>(url, data, config),
    delete: <T = any>(url: string) => api.delete<T>(url),
};
