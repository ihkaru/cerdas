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
    tables_count?: number;
    memberships_count?: number;
    tables?: any[];
    memberships?: any[];
    views?: any[];
    navigation?: any[];
    mode?: 'simple' | 'complex';
}

export interface DashboardStats {
    totalApps: number;
    totalTables: number;
    published: number;
    responses: number;
}

export interface RecentTable {
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
        totalTables: 0,
        published: 0,
        responses: 0
    });
    const recentTables = ref<RecentTable[]>([]);

    const loading = ref(false);
    const error = ref<string | null>(null);

    async function fetchApps() {
        console.log('[AppStore] fetchApps called, current apps:', apps.value.length);
        loading.value = true;
        try {
            const res = await ApiClient.get('/apps');
            console.log('[AppStore] fetchApps received:', res.data.data?.length, 'apps');
            apps.value = res.data.data;
        } catch (e: any) {
            error.value = e.message || 'Failed to fetch apps';
            console.error(e);
        } finally {
            loading.value = false;
        }
    }

    async function fetchDashboard() {
        console.log('[AppStore] fetchDashboard called, current apps:', apps.value.length);
        loading.value = true;
        try {
            const res = await ApiClient.get('/dashboard');
            const data = res.data.data;
            
            // Map dashboard data to store state
            console.log('[AppStore] fetchDashboard received, apps in response:', data.apps?.length);
            if (data.apps && Array.isArray(data.apps)) {
                 apps.value = data.apps;
            }
            recentTables.value = data.recent_tables || [];
            
            stats.value = {
                totalApps: data.apps?.length || 0,
                totalTables: data.stats?.total_tables || 0, 
                published: data.stats?.published || 0,
                responses: data.stats?.completed || 0,
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
            // Only reset if we are switching apps
            if (currentApp.value && (String(currentApp.value.id) !== String(idOrSlug) && currentApp.value.slug !== idOrSlug)) {
                 currentApp.value = null;
            }
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

    async function createApp(payload: { name: string; description?: string; mode?: string }) {
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
        recentTables,
        loading,
        error,
        fetchApps,
        fetchDashboard,
        fetchApp,
        createApp,
        resetCurrentApp
    };
});
