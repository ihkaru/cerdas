
import { syncService } from '../services/SyncService';

export function useSync() {
    return {
        sync: async () => await syncService.syncGlobal(), // Default to global
        syncTable: async (tableId: string, onProgress?: (phase: string, progress?: number) => void) => 
            await syncService.syncTable(tableId, onProgress),
        syncTableDataOnly: async (tableId: string, onProgress?: (phase: string, progress?: number) => void) => 
            await syncService.syncTableDataOnly(tableId, onProgress),
        push: async () => await syncService.push(),
        syncApp: async (appId: string, onProgress?: (phase: string, progress?: number) => void) => 
            await syncService.syncApp(appId, onProgress),
    };
}
