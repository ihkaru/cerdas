
import { Capacitor } from '@capacitor/core';
import { logger } from '../utils/logger';

export class ApiClient {
    private baseUrl: string;
    private rootUrl: string;

    constructor() {
        // Get all platform info for debugging
        const platform = Capacitor.getPlatform();
        const isNative = Capacitor.isNativePlatform();
        const isInIframe = window.self !== window.top;
        const envUrl = import.meta.env.VITE_API_URL;
        
        logger.debug('[ApiClient] Platform detection:', {
            platform,
            isNative,
            isInIframe,
            envUrl: envUrl || '(not set)',
            userAgent: navigator.userAgent.substring(0, 50)
        });

        // Robust platform detection: treat iframe as web regardless of Capacitor detection
        const isActuallyWeb = platform === 'web' || isInIframe || !isNative;
        
        let url = import.meta.env.VITE_API_BASE_URL || envUrl || 'http://localhost:8080/api';
        
        if (!isActuallyWeb && url.includes('localhost')) {
            url = url.replace('localhost', '10.0.2.2');
        }

        this.baseUrl = url;
        // Derive root URL by removing '/api' suffix
        this.rootUrl = this.baseUrl.replace(/\/api\/?$/, '');
        
        logger.info(`ApiClient initialized. Base: ${this.baseUrl}, Root: ${this.rootUrl}`);
    }

    private getHeaders() {
        const token = localStorage.getItem('auth_token');
        return {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': token ? `Bearer ${token}` : '',
        };
    }

    private async handleResponse(res: Response) {
        if (res.status === 401) {
            logger.warn('Unauthorized access (401). Redirecting to login...');
            localStorage.removeItem('auth_token');
            // Force reload/redirect to login
            // Using window.location to ensure clean state reset
            if (!window.location.href.includes('/login')) {
                 window.location.href = '/login';
            }
            throw new Error('Unauthorized');
        }
        
        if (!res.ok) {
            const errorText = await res.text().catch(() => res.statusText);
            throw new Error(`API Error ${res.status}: ${errorText || res.statusText}`);
        }

        const text = await res.text();
        try {
            return JSON.parse(text);
        } catch (e: any) {
            logger.error(`API JSON Parse Error. Status: ${res.status}. URL: ${res.url}`);
            logger.error(`Response length: ${text.length}`);
            logger.error(`Response snippet (start): ${text.substring(0, 200)}`);
            logger.error(`Response snippet (end): ${text.substring(Math.max(0, text.length - 200))}`);
            
            // Try to find position from error message
            const match = e.message.match(/position (\d+)/);
            if (match) {
                const pos = parseInt(match[1]);
                const start = Math.max(0, pos - 50);
                const end = Math.min(text.length, pos + 50);
                logger.error(`Error Context at pos ${pos}: ...${text.substring(start, end)}...`);
            }

            throw new Error(`JSON Parse Failed: ${e.message}`);
        }
    }

    async get(endpoint: string, params: Record<string, any> = {}) {
        const url = new URL(`${this.baseUrl}${endpoint}`);
        Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

        const res = await fetch(url.toString(), {
            method: 'GET',
            headers: this.getHeaders(),
        });

        return this.handleResponse(res);
    }

    async post(endpoint: string, data: any) {
        const res = await fetch(`${this.baseUrl}${endpoint}`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(data),
        });

        return this.handleResponse(res);
    }
    getAssetUrl(path: string) {
        if (!path) return '';
        if (path.startsWith('http') || path.startsWith('data:')) return path;
        
        // Transform /storage/xyz -> /media/xyz
        // This routes through the Laravel Proxy which adds 'Cross-Origin-Resource-Policy: cross-origin' header
        // Required because the Editor uses 'Cross-Origin-Embedder-Policy: require-corp'
        let proxyPath = path;
        if (path.startsWith('/storage/')) {
            proxyPath = '/media/' + path.substring('/storage/'.length);
        } else if (path.startsWith('storage/')) {
            proxyPath = '/media/' + path.substring('storage/'.length);
        } else {
             // Fallback for non-storage paths (unlikely in this context)
             // If path doesn't start with /storage, just append it.
             // But if it's meant to be static, it might fail. 
             // Assuming all user content is in /storage.
             if (!path.startsWith('/')) proxyPath = '/' + path;
             if (!path.startsWith('/media')) proxyPath = '/media' + proxyPath;
        }

        // Use rootUrl instead of baseUrl to avoid attaching /api suffix to assets
        return `${this.rootUrl}${proxyPath}`;
    }

    /**
     * Get user's context (role, organization) for a specific app
     * Used to populate ClosureContext for form validation/logic
     */
    async getAppContext(appId: number | string): Promise<{
        user: {
            id: number;
            email: string;
            name: string;
            role: 'app_admin' | 'org_admin' | 'supervisor' | 'enumerator';
            organizationId: number | null;
            organizationName: string | null;
        };
        app: {
            id: number;
            uuid: string;
            mode: 'simple' | 'complex';
        };
    } | null> {
        try {
            const res = await this.get(`/apps/${appId}/context`);
            if (res.success && res.data) {
                return res.data;
            }
            return null;
        } catch (e) {
            logger.error('Failed to fetch app context', e);
            return null;
        }
    }
}

export const apiClient = new ApiClient();
