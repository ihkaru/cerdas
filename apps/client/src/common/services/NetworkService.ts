
import { Network } from '@capacitor/network';
import type { ConnectionStatus } from '@capacitor/network';
import { ref, readonly } from 'vue';
import { logger } from '../utils/logger';

export class NetworkService {
    private static instance: NetworkService;
    private _status = ref<ConnectionStatus>({
        connected: navigator.onLine,
        connectionType: 'unknown' as any
    });

    private constructor() {
        this.initialize();
    }

    public static getInstance(): NetworkService {
        if (!NetworkService.instance) {
            NetworkService.instance = new NetworkService();
        }
        return NetworkService.instance;
    }

    private async initialize() {
        // Init with current status
        try {
            const status = await Network.getStatus();
            this._status.value = status;
            logger.debug('[NetworkService] Initial status:', status);
        } catch (e) {
            logger.warn('[NetworkService] Failed to get initial status from Capacitor, using browser fallback', e);
            this._status.value = {
                connected: navigator.onLine,
                connectionType: 'unknown' as any
            };
        }

        // Listen for changes
        Network.addListener('networkStatusChange', (status) => {
            logger.info('[NetworkService] Status changed:', status);
            this._status.value = status;
        });

        // Browser fallback events
        window.addEventListener('online', () => this.updateWebStatus(true));
        window.addEventListener('offline', () => this.updateWebStatus(false));
    }

    private updateWebStatus(connected: boolean) {
        if (this._status.value.connected !== connected) {
            logger.debug(`[NetworkService] Web fallback status: ${connected ? 'online' : 'offline'}`);
            this._status.value = {
                ...this._status.value,
                connected
            };
        }
    }

    public get status() {
        return readonly(this._status);
    }

    public isOnline(): boolean {
        return this._status.value.connected;
    }
}

export const networkService = NetworkService.getInstance();
