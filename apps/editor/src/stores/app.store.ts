import { defineStore } from 'pinia';
import { ref } from 'vue';
import { ApiClient } from '../common/api/ApiClient';

export interface AppModel {
    id: number;
    name: string;
    description: string;
    slug: string;
    created_at: string;
    pending_tasks?: number;
    forms_count?: number;
    memberships_count?: number;
    forms?: any[];
    memberships?: any[];
}

export interface DashboardStats {
    totalApps: number;
    totalForms: number;
    published: number;
    responses: number;
}

export interface RecentForm {
    id: number;
    name: string;
    app_name?: string;
    updated_at: string;
    version?: number;
}

export const useAppStore = defineStore('app', () => {
    const apps = ref<AppModel[]>([]);
    const currentApp = ref<AppModel | null>(null);
    const stats = ref<DashboardStats>({
        totalApps: 0,
        totalForms: 0,
        published: 0,
        responses: 0
    });
    const recentForms = ref<RecentForm[]>([]);

    const loading = ref(false);
    const error = ref<string | null>(null);

    async function fetchApps() {
        loading.value = true;
        try {
            const res = await ApiClient.get('/apps');
            apps.value = res.data.data;
        } catch (e: any) {
            error.value = e.message || 'Failed to fetch apps';
            console.error(e);
        } finally {
            loading.value = false;
        }
    }

    async function fetchDashboard() {
        loading.value = true;
        try {
            const res = await ApiClient.get('/dashboard');
            const data = res.data.data;
            
            // Map dashboard data to store state
            // Apps list from dashboard might be simplified, but we need it for sidebar
            if (data.apps && Array.isArray(data.apps)) {
                 apps.value = data.apps;
            }
            recentForms.value = data.recent_forms;
            
            // Stats logic?
            // Dashboard now returns { pending, in_progress, completed }
            // If homepage expects totalApps/forms, we might need to adjust Backend or calculate here.
            // Backend DashboardController returns: stats (assignments), apps (list), recent_forms.
            // It DOES NOT return totalApps global count directly in 'stats' object (it returns assignment stats).
            // But we can count apps.value.length.
            
            stats.value = {
                totalApps: data.apps.length,
                totalForms: 0, // Need to fetch or calculate?
                published: 0,
                responses: data.stats.completed, // Approximation
            };

        } catch (e: any) {
            error.value = e.message || 'Failed to fetch dashboard';
            console.error(e);
        } finally {
            loading.value = false;
        }
    }

    async function fetchApp(idOrSlug: number | string) {
        loading.value = true;
        
        // Optimistic load: check if we have it in list
        const cached = apps.value.find(a => 
            String(a.id) === String(idOrSlug) || a.slug === idOrSlug
        );
        if (cached) {
            currentApp.value = cached;
        } else {
            currentApp.value = null;
        }

        try {
            const res = await ApiClient.get(`/apps/${idOrSlug}`);
            currentApp.value = res.data.data;
        } catch (e: any) {
            error.value = e.message || 'Failed to fetch app';
        } finally {
            loading.value = false;
        }
    }

    async function createApp(payload: { name: string; description?: string }) {
        loading.value = true;
        try {
            const res = await ApiClient.post('/apps', payload);
            apps.value.push(res.data.data);
            return res.data.data;
        } catch (e: any) {
            error.value = e.message || 'Failed to create app';
            throw e;
        } finally {
            loading.value = false;
        }
    }

    function resetCurrentApp() {
        currentApp.value = null;
    }

    return {
        apps,
        currentApp,
        stats,
        recentForms,
        loading,
        error,
        fetchApps,
        fetchDashboard,
        fetchApp,
        createApp,
        resetCurrentApp
    };
});
