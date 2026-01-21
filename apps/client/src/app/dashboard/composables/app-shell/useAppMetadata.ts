import { useDatabase } from '@/common/composables/useDatabase';
import { useLogger } from '@/common/utils/logger';
import type { Ref } from 'vue';
import { ref } from 'vue';
import { AppMetadataService } from '../../services/AppMetadataService';

export function useAppMetadata(
    formId: string, 
    refreshData: () => Promise<void>,
    fetchAppContext: (appId: string | number) => Promise<void>,
    currentUserRole: Ref<string>, 
    authStore: any
) {
    const log = useLogger('UseAppMetadata');
    const db = useDatabase();

    const appNavigation = ref<any[]>([]);
    const appViews = ref<any[]>([]);
    const appForms = ref<any[]>([]);
    const activeView = ref<string>('');

    const loadAppMetadata = async (schemaData: any, isRefresh: boolean, loading: Ref<boolean>) => {
        try {
            const conn = await db.getDB();

            // Resolve App ID
            let appId = schemaData?.app_id;
            let validAppId = await AppMetadataService.resolveAppId(conn, formId, appId);
            
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
                    const { navigation, views } = await AppMetadataService.getLocalAppMetadata(conn, validAppId);
                    
                    log.info(`Local Metadata loaded: ${navigation?.length} nav items, ${views?.length} views`);
                    
                    if (navigation.length) {
                        appNavigation.value = navigation;
                        // Auto-select first view if none selected
                        if (!activeView.value && navigation[0]?.view_id) {
                            activeView.value = navigation[0].view_id;
                            log.debug('Auto-selected default view (Local):', activeView.value);
                        }
                    }
                    if (views.length) appViews.value = views;

                    appForms.value = await AppMetadataService.getSiblingForms(conn, validAppId);
                } catch (e) {
                    log.warn('Failed to load local app metadata', e);
                }

                // 4. Fetch Data (Assignments) via Helper (IMMEDIATELY FROM LOCAL DB)
                await refreshData();
                
                // OPTIMIZATION: Show UI immediately if we have local data, don't wait for remote sync
                if (!isRefresh) loading.value = false;

                // B. If Online, Sync & Update Local DB (Background / Late Update)
                if (navigator.onLine) {
                    try {
                        log.info('Fetching App Metadata from API...');
                        const result = await AppMetadataService.syncAppMetadata(conn, validAppId);
                        
                        // Fetch user's role and organization for this app
                        await fetchAppContext(validAppId);
                        
                        if (result) {
                            log.info(`Remote Metadata synced. Views: ${result.appData?.views?.length}`);

                            if (result.appData) {
                                // Update Reactively
                                appNavigation.value = result.appData.navigation || []; // Ensure array
                                appViews.value = result.appData.views || []; // Ensure array

                                // Auto-select first view if none selected
                                if (!activeView.value && appNavigation.value.length > 0 && appNavigation.value[0]?.view_id) {
                                    activeView.value = appNavigation.value[0].view_id;
                                }
                            }
                            if (result.forms) {
                                appForms.value = result.forms;
                            }
                        }
                    } catch (e) {
                        log.warn('Failed to fetch remote app metadata', e);
                    }
                }
            } else {
                 // No valid app ID, just refresh data
                 await refreshData();
            }

        } catch (e) {
            console.error('Failed to load app metadata', e);
        }
    };

    return {
        appNavigation,
        appViews,
        appForms,
        activeView,
        loadAppMetadata
    };
}
