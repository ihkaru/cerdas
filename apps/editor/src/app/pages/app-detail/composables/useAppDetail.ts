import { useAppStore } from '@/stores';
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import type { AppDetail, AppForm, AppMember } from '../types/app-detail.types';
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

    async function fetchApp(slug: string) {
        await appStore.fetchApp(slug);
    }

    return {
        app,
        forms,
        members,
        loading,
        fetchApp,
        currentAppRaw: computed(() => appStore.currentApp)
    };
}
