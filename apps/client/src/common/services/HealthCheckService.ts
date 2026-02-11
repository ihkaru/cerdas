import { f7 } from 'framework7-vue';
import { ApiClient, apiClient } from '../../common/api/ApiClient';
// import Echo from '../echo'; // Echo not yet implemented in Client
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

    public async checkApi(): Promise<boolean> {
        try {
            // Use a lightweight, public endpoint for connectivity check.
            await this.apiClient.get('/ping');
            return true;
        } catch (error) {
            logger.error('[HealthCheck] API Check Failed:', error);
            
            // DIAGNOSTIC PROBE: Check if it's CORS or Network
            try {
                logger.info('[HealthCheck] Probing with no-cors mode...');
                const probe = await fetch(`${this.apiClient.baseUrl}/ping`, { mode: 'no-cors' });
                logger.warn('[HealthCheck] Probe success (type=' + probe.type + '). This indicates a CORS configuration issue on the server!');
            } catch (probeError) {
                logger.error('[HealthCheck] Probe failed too. This indicates a low-level Network or SSL issue (DNS, Certificate, Offline).', probeError);
            }

            return false;
        }
    }

    public checkReverb(): boolean | null {
        // Echo not yet implemented in Client
        return null; 
        /*
        try {
            // @ts-ignore
            const state = Echo.connector.pusher.connection.state;
            logger.info('[HealthCheck] Reverb State:', { state });
            return state === 'connected' || state === 'connecting';
        } catch (error) {
            logger.error('[HealthCheck] Reverb Check Failed:', error);
            return false;
        }
        */
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
