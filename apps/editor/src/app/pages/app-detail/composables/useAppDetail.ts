import { ApiClient } from '@/common/api/ApiClient';
import { useAppStore } from '@/stores';
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import type { AppDetail, AppForm, AppInvitation, AppMember, AppNavigationItem, AppOrganization, AppView } from '../types/app-detail.types';
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

    const organizations = computed<AppOrganization[]>(() => {
        const rawOrgs = (appStore.currentApp as any)?.organizations || [];
        return rawOrgs.map((o: any) => ({
            id: o.id,
            name: o.name,
            code: o.code
        }));
    });

    const forms = computed<AppForm[]>(() => {
        // Use 'tables' from the updated model, fall back to 'forms' just in case of old API response
        const rawForms = (appStore.currentApp as any)?.tables || (appStore.currentApp as any)?.forms || [];

        return rawForms.map((f: any) => ({
            id: f.id,
            name: f.name,
            description: f.description || 'No description',
            icon: f.settings?.icon || 'doc_text_fill', // Updated to use settings.icon if available
            status: f.current_version ? 'published' : 'draft',
            version: f.current_version || 1,
            fieldCount: f.fields?.length || 0, // Fallback if count not provided directly
            responseCount: f.response_count || 0,
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

    const invitations = computed<AppInvitation[]>(() => {
        const rawInvites = (appStore.currentApp as any)?.invitations || [];
        return rawInvites.map((i: any) => ({
            id: i.id,
            email: i.email,
            role: i.role,
            created_at: i.created_at
        }));
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
            // eslint-disable-next-line
            id: item.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(Math.random())),
            type: item.type || 'view',
            view_id: item.view_id,
            label: item.label || 'Item',
            icon: item.icon || 'square',
            children: item.children ? item.children.map(mapNav) : undefined
        });
        
        return rawNav.map(mapNav);
    });

    // Actions


    async function addOrganization(orgId: string | number) {
        if (!appStore.currentApp) return;
        try {
            loading.value = true;
            await ApiClient.post(`/apps/${appStore.currentApp.id}/organizations`, {
                organization_id: orgId
            });
            // Refresh
            await fetchApp(appStore.currentApp.id);
        } finally {
            loading.value = false;
        }
    }

    async function removeOrganization(orgId: string | number) {
        if (!appStore.currentApp) return;
        try {
            loading.value = true;
            await ApiClient.delete(`/apps/${appStore.currentApp.id}/organizations/${orgId}`);
            // Refresh
            await fetchApp(appStore.currentApp.id);
        } finally {
            loading.value = false;
        }
    }

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
    
    async function addMember(email: string, role: string) {
        if (!appStore.currentApp) return;
        try {
            loading.value = true;
            await ApiClient.post(`/apps/${appStore.currentApp.id}/members`, {
                email,
                role
            });
            await fetchApp(appStore.currentApp.id);
        } finally {
            loading.value = false;
        }
    }

    async function removeMember(userId: string | number) {
        if (!appStore.currentApp) return;
        try {
            loading.value = true;
            await ApiClient.delete(`/apps/${appStore.currentApp.id}/members/${userId}`);
            await fetchApp(appStore.currentApp.id);
        } finally {
            loading.value = false;
        }
    }

    async function cancelInvitation(invitationId: string | number) {
        if (!appStore.currentApp) return;
        try {
            loading.value = true;
            await ApiClient.delete(`/apps/${appStore.currentApp.id}/invitations/${invitationId}`);
            await fetchApp(appStore.currentApp.id);
        } finally {
            loading.value = false;
        }
    }

    // Consolidated fetchApp
    async function fetchApp(slugOrId: string | number) {
        return appStore.fetchApp(String(slugOrId));
    }

    return {
        app,
        forms,
        members,
        invitations,
        views,
        navigation,
        organizations,
        loading,
        fetchApp,
        createView,
        updateNavigation,
        addOrganization,
        removeOrganization,
        addMember,
        removeMember,
        cancelInvitation,
        currentAppRaw: computed(() => appStore.currentApp)
    };
}
