import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useDatabase } from '../../../common/composables/useDatabase';
import { useLogger } from '../../../common/utils/logger';
import { DashboardRepository } from '../repositories/DashboardRepository';
import type { Assignment, Form } from '../types';

export const useDashboardStore = defineStore('dashboard', () => {
    const logger = useLogger('DashboardStore');
    const db = useDatabase(); 

    // State
    const apps = ref<Form[]>([]);
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
                DashboardRepository.getForms(conn),
                DashboardRepository.getAssignments(conn),
                DashboardRepository.getPendingUploadCount(conn),
                DashboardRepository.getAssignmentCount(conn),
                DashboardRepository.getAssignmentStats(conn)
            ]);

            // Apply Preview Overrides if running in Editor
            apps.value = fetchedApps.map(app => {
                const override = (window as any).__SCHEMA_OVERRIDE?.[app.id];
                if (override) {
                    return {
                        ...app,
                        name: override.schema.name || app.name,
                        description: override.schema.description || app.description,
                        settings: override.schema.settings || app.settings
                    };
                }
                return app;
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
