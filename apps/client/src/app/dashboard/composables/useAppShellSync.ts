import { useSync } from '@/common/composables/useSync';
import { f7 } from 'framework7-vue';
import { ref } from 'vue';

export function useAppShellSync(
    formId: string, 
    refreshCallback: (full?: boolean) => Promise<void>,
    onSyncStart?: () => void
) {
    const sync = useSync();
    
    const isSyncing = ref(false);
    const syncProgress = ref(0);
    const syncMessage = ref('');

    const syncApp = async (formIdOverride?: string) => {
        const targetFormId = formIdOverride || formId;

        // PROTECTION: Disable Sync in Preview Mode (Drafts don't exist on server)
        const isPreview = (window as any).__SCHEMA_OVERRIDE?.[targetFormId];
        
        isSyncing.value = true;
        syncProgress.value = 0;
        syncMessage.value = 'Initializing sync...';
        
        if (onSyncStart) onSyncStart();

        try {
            if (isPreview) {
                f7.toast.show({ text: 'Preview Mode: Syncing data only...', closeTimeout: 2000 });
                // Use new Data-Only Sync to preserve Schema Draft
                await sync.syncAppDataOnly(targetFormId, (phase, progress) => {
                    syncMessage.value = phase;
                    if (progress !== undefined) syncProgress.value = progress;
                });
            } else {
                await sync.syncApp(targetFormId, (phase, progress) => {
                    syncMessage.value = phase;
                    if (progress !== undefined) syncProgress.value = progress;
                });
            }
            
            syncMessage.value = 'Reloading data...';
            // Force reload but keep override if present (loadApp handles this)
            await refreshCallback(true);
            
            f7.toast.show({ text: 'App updated', closeTimeout: 2000 });
        } catch (e: any) {
            // Special handling for 404 in Preview Mode
            if (isPreview && String(e).includes('404')) {
                f7.dialog.alert(
                    'Form ini belum ada di server. Silakan simpan/publish form terlebih dahulu agar bisa sync data.',
                    'Data Tidak Ditemukan'
                );
            } else {
                f7.dialog.alert('Sync failed - ' + e.message, 'Error');
            }
        } finally {
            setTimeout(() => {
                isSyncing.value = false;
            }, 500);
        }
    };

    return {
        isSyncing,
        syncProgress,
        syncMessage,
        syncApp
    };
}
