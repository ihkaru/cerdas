import { useSync } from '@/common/composables/useSync';
import { f7 } from 'framework7-vue';
import { ref } from 'vue';

export function useAppShellSync(
    contextId: string, 
    refreshCallback: (full?: boolean) => Promise<void>,
    onSyncStart?: () => void
) {
    const sync = useSync();
    
    const isSyncing = ref(false);
    const syncProgress = ref(0);
    const syncMessage = ref('');

    const syncApp = async (contextIdOverride?: string) => {
        const targetId = contextIdOverride || contextId;

        // PROTECTION: Disable Sync in Preview Mode (Drafts don't exist on server)
        const override = (window as any).__SCHEMA_OVERRIDE?.[targetId] || (window as any).__SCHEMA_OVERRIDE?.[`APP_${targetId}`];
        const isPreview = !!override;
        const isEditorDirty = override?.isDirty === true;
        
        const executeSync = async () => {
            isSyncing.value = true;
            syncProgress.value = 0;
            syncMessage.value = 'Initializing sync...';
            
            if (onSyncStart) onSyncStart();

            try {
                if (isPreview) {
                    f7.toast.show({ text: 'Preview Mode: Syncing data only...', closeTimeout: 2000 });
                    // Use App Sync with dataOnly option to sync ALL app tables while preserving drafts
                    await sync.syncApp(targetId, (phase: string, progress?: number) => {
                        syncMessage.value = phase;
                        if (progress !== undefined) syncProgress.value = progress;
                    }, { dataOnly: true });
                } else {
                    // Use SyncApp to ensure ALL data sources (multi-table) are synced
                    await sync.syncApp(targetId, (phase: string, progress?: number) => {
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
                        'Form/skema tabel ini belum terdaftar di server. Silakan klik "Save Draft" atau "Publish" pada editor terlebih dahulu agar data lokal ini dapat dikirimkan.',
                        'Skema Belum Disimpan'
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

        if (isPreview && isEditorDirty) {
            f7.dialog.confirm(
                'Anda berada dalam Mode Pratinjau dengan perubahan skema yang belum disimpan.\n\nHarap simpan draft di Editor (klik "Save Draft") terlebih dahulu agar perubahan skema Anda terdaftar di server backend sebelum mengirim data lokal.\n\nApakah Anda ingin tetap mencoba sinkronisasi sekarang?',
                'Skema Belum Disimpan',
                () => {
                    executeSync();
                }
            );
        } else {
            await executeSync();
        }
    };

    return {
        isSyncing,
        syncProgress,
        syncMessage,
        syncApp
    };
}
