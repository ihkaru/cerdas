import { ref, watch } from 'vue';
import { ApiClient } from '@/common/api/ApiClient';
import { f7 } from 'framework7-vue';

export function useAppJoinLink(appIdProvider: () => string | null | undefined) {
    const loading = ref(false);
    const joinLink = ref<any>(null);

    async function fetchJoinLink() {
        const appId = appIdProvider();
        if (!appId || appId === 'undefined') {
            joinLink.value = null;
            return;
        }

        loading.value = true;
        try {
            const res = await ApiClient.get(`/apps/${appId}/join-link`);
            joinLink.value = res.data.data;
        } catch (e) {
            console.error('Failed to fetch join link', e);
            joinLink.value = null;
        } finally {
            loading.value = false;
        }
    }

    // Auto-fetch when appId becomes available or changes
    watch(appIdProvider, (newId) => {
        if (newId && newId !== 'undefined') {
            fetchJoinLink();
        } else {
            joinLink.value = null;
        }
    }, { immediate: true });

    async function toggleJoinLink(isActive: boolean, role: string = 'enumerator') {
        const appId = appIdProvider();
        if (!appId) return;

        try {
            const res = await ApiClient.post(`/apps/${appId}/join-link`, {
                is_active: isActive,
                role
            });
            joinLink.value = res.data.data;
            f7.toast.show({
                text: isActive ? 'Join link enabled' : 'Join link disabled',
                closeTimeout: 2000,
                color: 'green'
            });
        } catch (e) {
            f7.dialog.alert('Failed to update join link settings');
        }
    }

    async function regenerateJoinLink() {
        const appId = appIdProvider();
        if (!appId) return;

        f7.dialog.confirm('Regenerating will invalidate the current link. Do you want to continue?', async () => {
            try {
                const res = await ApiClient.delete(`/apps/${appId}/join-link`);
                joinLink.value = res.data.data;
                f7.toast.show({
                    text: 'New join link generated',
                    closeTimeout: 2000,
                    color: 'green'
                });
            } catch (e) {
                f7.dialog.alert('Failed to regenerate join link');
            }
        });
    }

    return {
        loading,
        joinLink,
        fetchJoinLink,
        toggleJoinLink,
        regenerateJoinLink
    };
}
