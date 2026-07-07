import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { useDatabase } from '../../../common/composables/useDatabase';
import { useLogger } from '../../../common/utils/logger';
import { DashboardRepository } from '../repositories/DashboardRepository';
import type { App, AppStats, AppWithStats, Assignment } from '../types';

export const useDashboardStore = defineStore('dashboard', () => {
    const logger = useLogger('DashboardStore');
    const db = useDatabase(); 

    // State
    const apps = ref<App[]>([]);
    const assignments = ref<Assignment[]>([]);
    const totalAssignments = ref(0);
    const assignmentStats = ref<{ status: string; count: number }[]>([]);
    const appStats = ref<AppStats[]>([]);
    const pendingUploads = ref(0);
    const lastSyncTime = ref<string | null>(null);
    const loading = ref(false);
    const initialized = ref(false);

    /**
     * Apps enriched with per-app assignment stats + smart urgency sort.
     *
     * Urgency score (sort key):
     *   pending × 3 + in_progress × 2 — so apps with overdue/pending work
     *   always float to the top. Completed apps score 0 and sink to the bottom.
     *
     * isCompleted: true only when the app has assignments AND all are done.
     * Apps with no assignments at all are treated as "new/unstarted" (not completed).
     */
    const appsWithStats = computed<AppWithStats[]>(() => {
        const now = new Date();
        return apps.value
            .map(app => {
                const raw = appStats.value.find(s => s.app_id === app.id);
                const stats: AppStats = raw ?? {
                    app_id: app.id,
                    pending: 0,
                    in_progress: 0,
                    completed: 0,
                    total: 0,
                };
                
                // Parse date bounds
                const isScheduled = app.start_date ? now < new Date(app.start_date) : false;
                const isExpired = app.end_date ? now > new Date(app.end_date) : false;
                const isHidden = isExpired && app.expired_behavior === 'hidden';

                // It counts as completed if either:
                // 1. All assignments are completed/synced (total > 0)
                // 2. The app is expired in read_only mode
                const isCompleted = (stats.total > 0 && stats.completed === stats.total) || 
                                    (isExpired && app.expired_behavior === 'read_only');

                // Scheduled apps go below active apps, but above completed apps
                // Urgency mapping: Active (pending * 3 + in_progress * 2) > Scheduled (-1) > Completed (-2)
                let urgency = stats.pending * 3 + stats.in_progress * 2;
                if (isScheduled) {
                    urgency = -1;
                } else if (isCompleted) {
                    urgency = -2;
                }

                return { 
                    ...app, 
                    stats, 
                    isCompleted, 
                    isScheduled, 
                    isExpired, 
                    isHidden, 
                    urgency 
                };
            })
            .filter(app => !app.isHidden)
            .sort((a, b) => b.urgency - a.urgency); // Most urgent first
    });

    /**
     * Load Dashboard Data
     * @param force - Bypass cache/initialized check
     */
    async function loadData(force = false) {
        if (loading.value) return;
        if (initialized.value && !force) return; 

        loading.value = true;
        try {
            const conn = await db.getDB();
            
            // Parallel fetch for performance
            const [fetchedApps, fetchedAssignments, fetchedPending, fetchedCount, fetchedStats, fetchedAppStats] = await Promise.all([
                DashboardRepository.getApps(conn),
                DashboardRepository.getAssignments(conn),
                DashboardRepository.getPendingUploadCount(conn),
                DashboardRepository.getAssignmentCount(conn),
                DashboardRepository.getAssignmentStats(conn),
                DashboardRepository.getAppStats(conn),
            ]);

            // Apply Preview Overrides if running in Editor
            apps.value = fetchedApps.map(app => {
                const tableOverride = (window as any).__SCHEMA_OVERRIDE?.[app.id];
                const appOverride = (window as any).__SCHEMA_OVERRIDE?.[`APP_${app.id}`];

                let merged = { ...app };

                if (tableOverride) {
                    merged = {
                        ...merged,
                        name: tableOverride.schema.name || merged.name,
                        description: tableOverride.schema.description || merged.description,
                    };
                }

                if (appOverride && appOverride.viewConfigs) {
                    merged.view_configs = appOverride.viewConfigs;
                }

                return merged;
            });

            assignments.value = fetchedAssignments;
            pendingUploads.value = fetchedPending;
            totalAssignments.value = fetchedCount;
            assignmentStats.value = fetchedStats;
            appStats.value = fetchedAppStats;
            lastSyncTime.value = new Date().toLocaleString('id-ID');
            initialized.value = true;

            logger.debug('Dashboard data refreshed', { 
                apps: apps.value.length, 
                assignments: assignments.value.length,
                stats: fetchedStats,
                appStats: fetchedAppStats,
            });
        } catch (e) {
            logger.error('Failed to load dashboard data', e);
            throw e; 
        } finally {
            loading.value = false;
        }
    }

    /**
     * Reset store state (Logout)
     */
    function reset() {
        apps.value = [];
        assignments.value = [];
        assignmentStats.value = [];
        appStats.value = [];
        pendingUploads.value = 0;
        lastSyncTime.value = null;
        initialized.value = false;
        loading.value = false;
    }

    return {
        // State
        apps,
        assignments,
        totalAssignments,
        assignmentStats,
        appStats,
        pendingUploads,
        lastSyncTime,
        loading,

        // Computed
        appsWithStats,
        
        // Actions
        loadData,
        reset
    };
});
