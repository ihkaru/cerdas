import { f7 } from 'framework7-vue';
import { ApiClient, apiClient } from '../../common/api/ApiClient';
import { logger } from '../utils/logger';

export class HealthCheckService {
    private static instance: HealthCheckService;
    private apiClient: ApiClient;

    private constructor() {
        this.apiClient = apiClient;
    }

    public static getInstance(): HealthCheckService {
        if (!HealthCheckService.instance) {
            HealthCheckService.instance = new HealthCheckService();
        }
        return HealthCheckService.instance;
    }

    /**
     * Enhanced API connectivity check with multi-layer diagnostics.
     * Tests: fetch → XMLHttpRequest → img probe, classifying failures precisely.
     */
    public async checkApi(): Promise<boolean> {
        const baseUrl = this.apiClient.baseUrl;
        const pingUrl = `${baseUrl}/ping`;
        
        logger.info('[HealthCheck] Starting comprehensive API check', { 
            pingUrl,
            origin: window.location.origin // CRITICAL: Log the actual origin
        });

        // ── Layer 1: Standard fetch (what the app uses) ──
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 8000);

            const response = await fetch(pingUrl, {
                method: 'GET',
                signal: controller.signal,
                headers: { 'Accept': 'application/json' },
            });
            clearTimeout(timeout);

            if (response.ok) {
                const data = await response.json();
                logger.info('[HealthCheck] ✅ API reachable via fetch', { status: response.status, data });
                return true;
            } else {
                logger.warn('[HealthCheck] ⚠️ API responded but with error status', {
                    status: response.status,
                    statusText: response.statusText,
                    headers: Object.fromEntries(response.headers.entries()),
                });
            }
        } catch (fetchError: any) {
            logger.error('[HealthCheck] ❌ fetch() failed', {
                name: fetchError.name,
                message: fetchError.message,
                type: fetchError.constructor?.name,
            });

            // Classify the error
            if (fetchError.name === 'AbortError') {
                logger.error('[HealthCheck] 🕐 TIMEOUT: Server did not respond within 8 seconds.');
            }
        }

        // ── Layer 2: XMLHttpRequest (bypasses some fetch quirks) ──
        logger.info('[HealthCheck] Trying XMLHttpRequest fallback...');
        const xhrResult = await this.checkWithXHR(pingUrl);
        if (xhrResult.success) {
            logger.warn('[HealthCheck] ⚠️ XHR succeeded but fetch failed! Likely a fetch polyfill or CORS issue.');
            return true;
        }

        logger.error('[HealthCheck] ❌ XHR also failed', {
            status: xhrResult.status,
            statusText: xhrResult.statusText,
            responseText: xhrResult.responseText?.substring(0, 200),
            readyState: xhrResult.readyState,
        });

        // ── Layer 3: no-cors fetch (detect CORS vs Network) ──
        logger.info('[HealthCheck] Probing with no-cors mode...');
        try {
            const probe = await fetch(pingUrl, { mode: 'no-cors' });
            // no-cors always returns opaque response (type: "opaque", status: 0)
            // If we get HERE, the server IS reachable but CORS is blocking
            logger.warn('[HealthCheck] 🔒 CORS ISSUE DETECTED!', {
                type: probe.type,
                status: probe.status,
                hint: 'Server is reachable but blocks cross-origin requests. Check CORS_ALLOWED_ORIGINS on the server includes "capacitor://localhost".',
            });
        } catch (probeError: any) {
            logger.error('[HealthCheck] 🌐 NETWORK/SSL ISSUE!', {
                name: probeError.name,
                message: probeError.message,
                hint: 'Even no-cors failed. Problem is DNS, SSL certificate, firewall, or device offline.',
            });
        }

        // ── Layer 4: Image probe (bypasses CORS entirely) ──
        logger.info('[HealthCheck] Probing with image load (CORS-free)...');
        const rootUrl = baseUrl.replace(/\/api\/?$/, '');
        const imgReachable = await this.checkWithImage(rootUrl + '/favicon.ico');
        if (imgReachable) {
            logger.warn('[HealthCheck] 🖼️ Image load succeeded → Server IS reachable. Problem is definitely CORS.');
        } else {
            logger.error('[HealthCheck] 🖼️ Image load also failed → Server is truly unreachable (DNS/SSL/Network).');
        }

        return false;
    }

    private checkWithXHR(url: string): Promise<{
        success: boolean;
        status: number;
        statusText: string;
        responseText: string;
        readyState: number;
    }> {
        return new Promise((resolve) => {
            const xhr = new XMLHttpRequest();
            xhr.timeout = 8000;
            xhr.open('GET', url, true);
            xhr.setRequestHeader('Accept', 'application/json');

            xhr.onload = () => {
                resolve({
                    success: xhr.status >= 200 && xhr.status < 300,
                    status: xhr.status,
                    statusText: xhr.statusText,
                    responseText: xhr.responseText,
                    readyState: xhr.readyState,
                });
            };

            xhr.onerror = () => {
                resolve({
                    success: false,
                    status: xhr.status,
                    statusText: xhr.statusText || 'Network Error',
                    responseText: xhr.responseText || '',
                    readyState: xhr.readyState,
                });
            };

            xhr.ontimeout = () => {
                resolve({
                    success: false,
                    status: 0,
                    statusText: 'Timeout',
                    responseText: '',
                    readyState: xhr.readyState,
                });
            };

            xhr.send();
        });
    }

    private checkWithImage(url: string): Promise<boolean> {
        return new Promise((resolve) => {
            const img = new Image();
            const timer = setTimeout(() => {
                img.src = '';
                resolve(false);
            }, 5000);

            img.onload = () => {
                clearTimeout(timer);
                resolve(true);
            };
            img.onerror = () => {
                clearTimeout(timer);
                resolve(false);
            };
            img.src = url + '?t=' + Date.now();
        });
    }

    public checkReverb(): boolean | null {
        return null;
    }

    public async runStartupChecks(silent: boolean = true) {
        logger.info('[HealthCheck] Running startup checks...');
        
        const apiOk = await this.checkApi();
        const reverbOk = this.checkReverb();

        if (!apiOk && !silent) {
            f7.dialog.alert('Gagal terhubung ke Server. Pastikan internet lancar.', 'Connection Error');
        }

        return { api: apiOk, reverb: reverbOk };
    }
}

export const healthCheck = HealthCheckService.getInstance();
