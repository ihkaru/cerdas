
import { useDatabase } from '@/common/composables/useDatabase';
import { useLogger } from '@/common/utils/logger';
import type { Ref } from 'vue';
import { ref } from 'vue';
import { AppMetadataService } from '../../services/AppMetadataService';

interface AuthStore {
    user: { role?: string | undefined } | null;
    updateUser: (data: any) => void;
}




export function useAppMetadata(
    contextId: string, 
    fetchAppContext: (appId: string | number) => Promise<void>,
    currentUserRole: Ref<string>, 
    authStore: AuthStore
) {
    const log = useLogger('UseAppMetadata');
    const db = useDatabase();

    const appNavigation = ref<Record<string, unknown>[]>([]);
    const appViews = ref<Record<string, unknown>[]>([]);
    const appViewConfigs = ref<Record<string, unknown>>({});
    const appTables = ref<Record<string, unknown>[]>([]);
    const activeView = ref<string>('');
    const appVersion = ref<string>('Draft');
    
    const SYNC_THROTTLE_MS = 30000;
    let lastSyncTimestamp = 0;

    /** Restore cached role from localStorage */
    function restoreCachedRole(appId: string) {
        const cachedRole = localStorage.getItem(`app_role_${appId}`);
        if (cachedRole) {
            currentUserRole.value = cachedRole;
            if (authStore.user && !authStore.user.role) {
                authStore.updateUser({ role: cachedRole });
            }
        }
    }

    /** Auto-select the first view if none is active */
    function autoSelectView(navigation: Record<string, unknown>[]) {
        if (!activeView.value && navigation.length > 0 && navigation[0]?.view_id) {
            activeView.value = navigation[0].view_id as string;
        }
    }

    /** Load local metadata from SQLite (offline support) */
    async function loadLocalMetadata(conn: any, appId: string) {
        try {
            const { navigation, viewConfigs, version } = await AppMetadataService.getLocalAppMetadata(conn, appId);
            log.info(`Local Metadata loaded: ${navigation?.length || 0} nav items, ${Object.keys(viewConfigs || {}).length} view configs, v${version}`);
            
            if (version) appVersion.value = version;
            if (navigation?.length) {
                appNavigation.value = navigation;
                autoSelectView(navigation);
            }
            if (viewConfigs && Object.keys(viewConfigs).length) {
                appViewConfigs.value = viewConfigs;
                // Sync appViews array for search/find logic
                appViews.value = Object.entries(viewConfigs).map(([id, cfg]: [string, any]) => ({ id, ...cfg }));
            }
            appTables.value = await AppMetadataService.getSiblingTables(conn, appId);
        } catch (e) {
            log.warn('Failed to load local app metadata', e);
        }
    }

    /** Background sync: fetch remote metadata and update reactively */
    function startBackgroundSync(conn: any, validAppId: string) {
        (async () => {
            try {
                log.info('Fetching App Metadata from API... (background)');
                const result: any = await AppMetadataService.syncAppMetadata(conn, validAppId);
                await fetchAppContext(validAppId);
                
                if (result?.appData) {
                    log.info(`Remote Metadata synced. ViewConfigs: ${Object.keys(result.appData.viewConfigs || {}).length}`);
                    appNavigation.value = result.appData.navigation || [];
                    appViewConfigs.value = result.appData.viewConfigs || {};
                    // Sync appViews array
                    appViews.value = Object.entries(appViewConfigs.value).map(([id, cfg]: [string, any]) => ({ id, ...cfg }));
                    if (result.appData.version) appVersion.value = result.appData.version;
                    autoSelectView(appNavigation.value);
                }
                if (result?.tables) appTables.value = result.tables;
            } catch (e) {
                log.warn('Failed to fetch remote app metadata', e);
            }
        })();
    }

    const loadAppMetadata = async (schemaData: Record<string, unknown> | null, isRefresh: boolean, loading: Ref<boolean>) => {
        try {
            const conn = await db.getDB();
            const appId = schemaData?.app_id as string | undefined;
            const validAppId = await AppMetadataService.resolveAppId(conn, contextId, appId);
            log.debug('Resolved validAppId:', validAppId);

            if (!validAppId) {
                log.debug('No valid app ID, skipping refreshData here');
                return;
            }

            restoreCachedRole(validAppId);
            await loadLocalMetadata(conn, validAppId);

            if (!isRefresh) loading.value = false;

            // Background sync (throttled)
            const now = Date.now();
            const shouldSync = isRefresh || (now - lastSyncTimestamp > SYNC_THROTTLE_MS);
            if (navigator.onLine && shouldSync) {
                lastSyncTimestamp = now;
                startBackgroundSync(conn, validAppId);
            }
        } catch (e) {
            console.error('Failed to load app metadata', e);
        }
    };

    /** Apply view config overrides directly (from editor preview) without re-reading SQLite */
    function applyViewConfigOverride(viewConfigs: Record<string, unknown>) {
        log.info('Applying view config override directly', { keys: Object.keys(viewConfigs) });
        appViewConfigs.value = viewConfigs;
        appViews.value = Object.entries(viewConfigs).map(([id, cfg]: [string, any]) => ({ id, ...cfg }));
    }

    return {
        appNavigation,
        appViews,
        appViewConfigs,
        appTables,
        activeView,
        loadAppMetadata,
        applyViewConfigOverride,
        appVersion
    };
}
