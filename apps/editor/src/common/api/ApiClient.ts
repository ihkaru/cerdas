import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

const api = axios.create({
    baseURL: API_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Expires': '0',
    }
});

// Interceptor for token and anti-cache parameters
api.interceptors.request.use(config => {
    const token = localStorage.getItem('auth_token');
    
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Enforce cache-buster for GET requests to bypass browser caching
    if (config.method?.toLowerCase() === 'get') {
        config.params = { ...config.params, _t: Date.now() };
    }
    
    console.log('[ApiClient] Request interceptor', { 
        url: config.url, 
        method: config.method,
        params: config.params,
        hasToken: !!token
    });
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
    getAssetUrl: (path: string) => {
        if (!path) return '';
        if (path.startsWith('data:')) return path;
        
        let finalPath = path;
        const rootUrl = API_URL.replace(/\/api\/?$/, '');
        
        // Rewrite incorrect domain configurations
        if (finalPath.startsWith('http')) {
            if (finalPath.includes('editor.dvlpid.my.id')) {
                finalPath = finalPath.replace(/https?:\/\/editor\.dvlpid\.my\.id/, '');
            } else {
                return finalPath;
            }
        }
        
        // Transform /storage/ -> /media/ (proxied via API to support CORS/CORP headers)
        let proxyPath = finalPath;
        if (finalPath.startsWith('/storage/')) {
            proxyPath = '/media/' + finalPath.substring('/storage/'.length);
        } else if (finalPath.startsWith('storage/')) {
            proxyPath = '/media/' + finalPath.substring('storage/'.length);
        } else {
             if (!finalPath.startsWith('/')) proxyPath = '/' + finalPath;
             if (!finalPath.startsWith('/media')) proxyPath = '/media' + proxyPath;
        }

        return `${rootUrl}${proxyPath}`;
    }
};
