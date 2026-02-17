import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useDatabase } from '../../../common/composables/useDatabase';
import { useLogger } from '../../../common/utils/logger';
import { DashboardRepository } from '../repositories/DashboardRepository';
import type { App, Assignment } from '../types';

export const useDashboardStore = defineStore('dashboard', () => {
    const logger = useLogger('DashboardStore');
    const db = useDatabase(); 

    // State
    const apps = ref<App[]>([]);
    const assignments = ref<Assignment[]>([]);
    const totalAssignments = ref(0);
    const assignmentStats = ref<{ status: string; count: number }[]>([]);
    const pendingUploads = ref(0);
    const lastSyncTime = ref<string | null>(null);
    const loading = ref(false);
    const initialized = ref(false);

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
            const [fetchedApps, fetchedAssignments, fetchedPending, fetchedCount, fetchedStats] = await Promise.all([
                DashboardRepository.getApps(conn),
                DashboardRepository.getAssignments(conn),
                DashboardRepository.getPendingUploadCount(conn),
                DashboardRepository.getAssignmentCount(conn),
                DashboardRepository.getAssignmentStats(conn)
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
            lastSyncTime.value = new Date().toLocaleString('id-ID');
            initialized.value = true;

            logger.debug('Dashboard data refreshed', { 
                apps: apps.value.length, 
                assignments: assignments.value.length,
                stats: fetchedStats
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
        pendingUploads,
        lastSyncTime,
        loading,
        
        // Actions
        loadData,
        reset
    };
});
