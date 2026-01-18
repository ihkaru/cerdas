
import { syncService } from '../services/SyncService';

export function useSync() {
    return {
        sync: async () => await syncService.syncGlobal(), // Default to global
        syncApp: async (schemaId: string, onProgress?: (phase: string, progress?: number) => void) => 
            await syncService.syncApp(schemaId, onProgress),
        syncAppDataOnly: async (schemaId: string, onProgress?: (phase: string, progress?: number) => void) => 
            await syncService.syncAppDataOnly(schemaId, onProgress),
        push: async () => await syncService.push(),
    };
}
