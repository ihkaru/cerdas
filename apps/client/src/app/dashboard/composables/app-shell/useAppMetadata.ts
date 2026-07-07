
import { useDatabase } from '@/common/composables/useDatabase';
import { useLogger } from '@/common/utils/logger';
import type { Ref } from 'vue';
import { ref } from 'vue';
import { AppMetadataService } from '../../services/AppMetadataService';
import { networkService } from '@/common/services/NetworkService';

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
        if (!activeView.value && navigation.length > 0) {
            const firstItem = navigation[0];
            if (!firstItem) return;
            const targetView = firstItem.view_id || firstItem.view;
            if (targetView) {
                activeView.value = targetView as string;
            }
        }
    }

    /** Load local metadata from SQLite (offline support) */
    async function loadLocalMetadata(conn: any, appId: string) {
        try {
            const { navigation, viewConfigs, version } = await AppMetadataService.getLocalAppMetadata(conn, appId);
            
            // Check memory overrides first (for Live Preview in Editor)
            const overrideKey = `APP_${appId}`;
            const override = (window as any).__SCHEMA_OVERRIDE?.[overrideKey];
            
            const finalNavigation = override?.navigation || navigation;
            const finalViewConfigs = override?.viewConfigs || viewConfigs;

            log.info(`Local Metadata loaded: ${finalNavigation?.length || 0} nav items, ${Object.keys(finalViewConfigs || {}).length} view configs, v${version}`);
            
            if (version) appVersion.value = version;
            if (finalNavigation && finalNavigation.length > 0) {
                appNavigation.value = finalNavigation;
                autoSelectView(finalNavigation);
            } else {
                appNavigation.value = [];
            }
            if (finalViewConfigs && Object.keys(finalViewConfigs).length) {
                appViewConfigs.value = finalViewConfigs;
                // Sync appViews array for search/find logic
                appViews.value = Object.entries(finalViewConfigs).map(([id, cfg]: [string, any]) => ({ id, ...cfg }));
            } else {
                appViewConfigs.value = {};
                appViews.value = [];
            }
            appTables.value = await AppMetadataService.getSiblingTables(conn, appId);
        } catch (e) {
            log.warn('Failed to load local app metadata', e);
        }
    }

    /** Background sync: fetch remote metadata and update reactively */
    async function startBackgroundSync(conn: any, validAppId: string) {
        try {
            log.info('Fetching App Metadata from API... (background/blocking if needed)');
            const result: any = await AppMetadataService.syncAppMetadata(conn, validAppId);
            await fetchAppContext(validAppId);
            
            // Check memory overrides first (for Live Preview in Editor)
            const overrideKey = `APP_${validAppId}`;
            const override = (window as any).__SCHEMA_OVERRIDE?.[overrideKey];

            if (result?.appData) {
                log.info(`Remote Metadata synced. ViewConfigs: ${Object.keys(result.appData.viewConfigs || {}).length}`);
                
                const finalNavigation = override?.navigation || result.appData.navigation || [];
                const finalViewConfigs = override?.viewConfigs || result.appData.viewConfigs || {};
                
                appNavigation.value = finalNavigation;
                appViewConfigs.value = finalViewConfigs;
                // Sync appViews array
                appViews.value = Object.entries(appViewConfigs.value).map(([id, cfg]: [string, any]) => ({ id, ...cfg }));
                if (result.appData.version) appVersion.value = result.appData.version;
                autoSelectView(appNavigation.value);
            } else if (override) {
                appNavigation.value = override.navigation || [];
                appViewConfigs.value = override.viewConfigs || {};
                appViews.value = Object.entries(appViewConfigs.value).map(([id, cfg]: [string, any]) => ({ id, ...cfg }));
                autoSelectView(appNavigation.value);
            }
            if (result?.tables) appTables.value = result.tables;
        } catch (e) {
            log.warn('Failed to fetch remote app metadata', e);
        }
    }

    async function handleMetadataSync(conn: any, validAppId: string, isRefresh: boolean, loading: Ref<boolean>) {
        const hasNav = appNavigation.value.length > 0;
        const hasConfigs = Object.keys(appViewConfigs.value).length > 0;
        const hasLocalViews = hasNav && hasConfigs;
        const shouldSync = isRefresh || (Date.now() - lastSyncTimestamp > SYNC_THROTTLE_MS);
        const isOnline = networkService.isOnline();

        if (!isOnline || !shouldSync) {
            if (!isRefresh) loading.value = false;
            return;
        }

        lastSyncTimestamp = Date.now();
        
        if (!hasLocalViews && !isRefresh) {
            log.info('[AppMetadata] No local views found. Awaiting remote metadata before rendering.');
            await startBackgroundSync(conn, validAppId);
            loading.value = false;
        } else {
            if (!isRefresh) loading.value = false;
            startBackgroundSync(conn, validAppId);
        }
    }

    const resolvedAppId = ref<string>('');

    const loadAppMetadata = async (schemaData: Record<string, unknown> | null, isRefresh: boolean, loading: Ref<boolean>) => {
        try {
            const conn = await db.getDB();
            const schemaAppId = schemaData?.app_id as string | undefined;
            const validAppId = await AppMetadataService.resolveAppId(conn, contextId, schemaAppId);
            log.debug('Resolved validAppId:', validAppId);

            if (!validAppId) {
                log.debug('No valid app ID, skipping refreshData here');
                if (!isRefresh) loading.value = false;
                return;
            }

            resolvedAppId.value = validAppId;

            restoreCachedRole(validAppId);
            await loadLocalMetadata(conn, validAppId);
            await handleMetadataSync(conn, validAppId, isRefresh, loading);

        } catch (e) {
            console.error('Failed to load app metadata', e);
            if (!isRefresh) loading.value = false;
        }
    };

    /** Apply view config overrides directly (from editor preview) without re-reading SQLite */
    function applyViewConfigOverride(viewConfigs: Record<string, unknown>) {
        log.info('Applying view config override directly', { keys: Object.keys(viewConfigs) });
        appViewConfigs.value = viewConfigs;
        appViews.value = Object.entries(viewConfigs).map(([id, cfg]: [string, any]) => ({ id, ...cfg }));
    }

    return {
        resolvedAppId,
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
