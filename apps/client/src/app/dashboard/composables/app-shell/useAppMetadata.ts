
import { useDatabase } from '@/common/composables/useDatabase';
import { useLogger } from '@/common/utils/logger';
import type { Ref } from 'vue';
import { ref } from 'vue';
import { AppMetadataService } from '../../services/AppMetadataService';

export function useAppMetadata(
    contextId: string, 
    // refreshData removed - now called in useAppShellLogic after loadTable for proper groupByConfig timing
    fetchAppContext: (appId: string | number) => Promise<void>,
    currentUserRole: Ref<string>, 
    authStore: any
) {
    const log = useLogger('UseAppMetadata');
    const db = useDatabase();

    const appNavigation = ref<any[]>([]);
    const appViews = ref<any[]>([]);
    const appTables = ref<any[]>([]); // Renamed from appForms
    const activeView = ref<string>('');
    const appVersion = ref<string>('Draft');
    
    // Cache timestamp to throttle API calls - only sync once every 30 seconds
    const SYNC_THROTTLE_MS = 30000;
    let lastSyncTimestamp = 0;

    const loadAppMetadata = async (schemaData: any, isRefresh: boolean, loading: Ref<boolean>) => {
        try {
            const conn = await db.getDB();

            // Resolve App ID
            let appId = schemaData?.app_id;
            // contextId might be AppID or TableID
            let validAppId = await AppMetadataService.resolveAppId(conn, contextId, appId);
            
            log.debug('Resolved validAppId:', validAppId);

            if (validAppId) {
                // Read Cached Role (Simple RLS for UI)
                const cachedRole = localStorage.getItem(`app_role_${validAppId}`);
                if (cachedRole) {
                    currentUserRole.value = cachedRole;
                    // Restore to authStore for closures (offline support)
                    if (authStore.user && !authStore.user.role) {
                        authStore.updateUser({ role: cachedRole as any });
                    }
                }

                // A. Try Local Database First (Offline Support)
                try {
                    const { navigation, views, version } = await AppMetadataService.getLocalAppMetadata(conn, validAppId);
                    
                    log.info(`Local Metadata loaded: ${navigation?.length || 0} nav items, ${views?.length || 0} views, v${version}`);
                    
                    if (version) appVersion.value = version;

                    if (navigation?.length) {
                        appNavigation.value = navigation;
                        // Auto-select first view if none selected
                        if (!activeView.value && navigation[0]?.view_id) {
                            activeView.value = navigation[0].view_id;
                            log.debug('Auto-selected default view (Local):', activeView.value);
                        }
                    }
                    if (views?.length) appViews.value = views;

                    appTables.value = await AppMetadataService.getSiblingTables(conn, validAppId);
                } catch (e) {
                    log.warn('Failed to load local app metadata', e);
                }

                // NOTE: refreshData is now called AFTER loadTable in useAppShellLogic
                // to ensure groupByConfig is available from layout before first data render
                
                // OPTIMIZATION: Show UI immediately if we have local data, don't wait for remote sync
                if (!isRefresh) loading.value = false;

                // B. If Online, Sync & Update Local DB (Background / Late Update)
                // Throttle: Skip API sync if synced recently (unless forced refresh)
                const now = Date.now();
                const shouldSync = isRefresh || (now - lastSyncTimestamp > SYNC_THROTTLE_MS);
                
                if (navigator.onLine && shouldSync) {
                    lastSyncTimestamp = now;
                    // BACKGROUND SYNC: Fire-and-forget, do NOT await
                    // This allows loadTable/refreshData to proceed immediately with local data
                    (async () => {
                        try {
                            log.info('Fetching App Metadata from API... (background)');
                            const result = await AppMetadataService.syncAppMetadata(conn, validAppId);
                            
                            // Fetch user's role and organization for this app
                            await fetchAppContext(validAppId);
                            
                            if (result) {
                                log.info(`Remote Metadata synced. Views: ${result.appData?.views?.length}`);

                                if (result.appData) {
                                    // Update Reactively
                                    appNavigation.value = result.appData.navigation || []; // Ensure array
                                    appViews.value = result.appData.views || []; // Ensure array
                                    if (result.appData.version) {
                                        appVersion.value = result.appData.version;
                                    }

                                    // Auto-select first view if none selected
                                    if (!activeView.value && appNavigation.value.length > 0 && appNavigation.value[0]?.view_id) {
                                        activeView.value = appNavigation.value[0].view_id;
                                    }
                                }
                                if (result.tables) {
                                    appTables.value = result.tables;
                                }
                            }
                        } catch (e) {
                            log.warn('Failed to fetch remote app metadata', e);
                        }
                    })(); // IIFE - immediately invoked, not awaited
                }
            } else {
                 // No valid app ID - refreshData will be called after loadTable in useAppShellLogic
                 log.debug('No valid app ID, skipping refreshData here');
            }

        } catch (e) {
            console.error('Failed to load app metadata', e);
        }
    };

    return {
        appNavigation,
        appViews,
        appTables,
        activeView,
        loadAppMetadata,
        appVersion
    };
}
