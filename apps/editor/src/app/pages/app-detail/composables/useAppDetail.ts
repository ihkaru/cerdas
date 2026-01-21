import { ApiClient } from '@/common/api/ApiClient';
import { useAppStore } from '@/stores';
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import type { AppDetail, AppForm, AppMember, AppNavigationItem, AppView } from '../types/app-detail.types';
import { useAppColors } from './useAppColors';

export function useAppDetail() {
    const appStore = useAppStore();
    const { loading } = storeToRefs(appStore);
    const { getAppColor, getMemberColor } = useAppColors();

    const app = computed<AppDetail>(() => {
        if (!appStore.currentApp) return {
            id: '',
            name: 'Loading...',
            description: '',
            color: '#ccc'
        };

        return {
            ...appStore.currentApp,
            color: getAppColor(appStore.currentApp.id)
        };
    });

    const forms = computed<AppForm[]>(() => {
        const rawForms = (appStore.currentApp as any)?.forms || [];

        return rawForms.map((f: any) => ({
            id: f.id,
            name: f.name,
            description: f.description || 'No description',
            icon: 'doc_text_fill',
            status: f.current_version ? 'published' : 'draft',
            version: f.current_version || 1,
            fieldCount: 0,
            responseCount: 0,
        }));
    });

    const members = computed<AppMember[]>(() => {
        const rawMembers = (appStore.currentApp as any)?.memberships || [];

        return rawMembers.map((m: any) => {
            const u = m.user;
            const name = u.name || 'Unknown';
            return {
                id: m.id,
                name: name,
                initials: name.substring(0, 2).toUpperCase(),
                role: m.role || 'Member',
                color: getMemberColor(u.id)
            };
        });
    });

    const views = computed<AppView[]>(() => {
        const rawViews = (appStore.currentApp as any)?.views || [];
        return rawViews.map((v: any) => ({
            id: v.id,
            name: v.name || 'Untitled View',
            type: v.type || 'table',
            config: v.config
        }));
    });

    const navigation = computed<AppNavigationItem[]>(() => {
        const rawNav = (appStore.currentApp as any)?.navigation || [];
        // Helper to map robustly
        const mapNav = (item: any): AppNavigationItem => ({
            id: item.id || String(Math.random()),
            type: item.type || 'view',
            view_id: item.view_id,
            label: item.label || 'Item',
            icon: item.icon || 'square',
            children: item.children ? item.children.map(mapNav) : undefined
        });
        
        return rawNav.map(mapNav);
    });

    // Actions (mocking backend for now if endpoints missing)
    async function createView(payload: { name: string; type: string }) {
        // Placeholder: POST /apps/:id/views
        console.log('Creating view:', payload);
        // await ApiClient.post...
        // Refresh app
    }

    async function updateNavigation(navItems: AppNavigationItem[]) {
        if (!appStore.currentApp) return;

        try {
            loading.value = true;
            await ApiClient.put(`/apps/${appStore.currentApp.id}`, {
                navigation: navItems
            });

            // Update local store optimistically
            appStore.currentApp.navigation = navItems;
            
        } catch (e) {
            console.error('Failed to update navigation', e);
            // Revert logic could be added here if needed
        } finally {
            loading.value = false;
        }
    }

    async function fetchApp(slug: string) {
        await appStore.fetchApp(slug);
    }

    return {
        app,
        forms,
        members,
        views,
        navigation,
        loading,
        fetchApp,
        createView,
        updateNavigation,
        currentAppRaw: computed(() => appStore.currentApp)
    };
}
