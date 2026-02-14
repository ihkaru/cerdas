
import { useDatabase } from '@/common/composables/useDatabase';
import { useLogger } from '@/common/utils/logger';
import type { Ref } from 'vue';
import { ref } from 'vue';
import { AppMetadataService } from '../../services/AppMetadataService';

interface AuthStore {
    user: { role?: string } | null;
    updateUser: (data: { role: string }) => void;
}

interface AppMetadata {
    navigation?: Record<string, unknown>[];
    views?: Record<string, unknown>[];
    version?: string;
}

interface SyncResult {
    appData?: AppMetadata;
    tables?: Record<string, unknown>[];
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
    async function loadLocalMetadata(conn: unknown, appId: string) {
        try {
            const { navigation, views, version } = await AppMetadataService.getLocalAppMetadata(conn, appId);
            log.info(`Local Metadata loaded: ${navigation?.length || 0} nav items, ${views?.length || 0} views, v${version}`);
            
            if (version) appVersion.value = version;
            if (navigation?.length) {
                appNavigation.value = navigation;
                autoSelectView(navigation);
            }
            if (views?.length) appViews.value = views;
            appTables.value = await AppMetadataService.getSiblingTables(conn, appId);
        } catch (e) {
            log.warn('Failed to load local app metadata', e);
        }
    }

    /** Background sync: fetch remote metadata and update reactively */
    function startBackgroundSync(conn: unknown, validAppId: string) {
        (async () => {
            try {
                log.info('Fetching App Metadata from API... (background)');
                const result: SyncResult = await AppMetadataService.syncAppMetadata(conn, validAppId);
                await fetchAppContext(validAppId);
                
                if (result?.appData) {
                    log.info(`Remote Metadata synced. Views: ${result.appData.views?.length}`);
                    appNavigation.value = result.appData.navigation || [];
                    appViews.value = result.appData.views || [];
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

    return {
        appNavigation,
        appViews,
        appTables,
        activeView,
        loadAppMetadata,
        appVersion
    };
}
