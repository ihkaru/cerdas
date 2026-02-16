
import { ApiClient } from '@/common/api/ApiClient';
import { f7 } from 'framework7-vue';
import { computed, ref } from 'vue';
import type { NavigationItem } from '../types/view-config.types';

export function useNavigationManagement(appId: () => string | null) {
    const navigation = ref<NavigationItem[]>([]);
    const selectedNavKey = ref<string>('');
    const isNavDirty = ref(false);

    const selectedNav = computed(() => {
        return navigation.value.find(n => n.id === selectedNavKey.value);
    });

    async function fetchNavigation() {
        const id = appId();
        if (!id || id === 'undefined' || id === 'null') return;
        try {
            const res = await ApiClient.get(`/apps/${id}`);
            navigation.value = res.data.data.navigation || [];
            isNavDirty.value = false; // Reset dirty state on fetch
        } catch (e) {
            console.error('Failed to fetch navigation', e);
        }
    }

    async function saveNavigation(views?: Record<string, unknown>) {
        const id = appId();
        if (!id) return;

        try {
            const payload: Record<string, unknown> = {
                navigation: navigation.value
            };

            // Include view configs alongside navigation for atomic save
            if (views) {
                payload.view_configs = views;
            }

            await ApiClient.put(`/apps/${id}`, payload);
            
            isNavDirty.value = false;
            f7.toast.show({ text: 'Navigation saved', position: 'center', closeTimeout: 1500 });
        } catch (e) {
            console.error('[useNavigationManagement] Failed to save navigation', e);
            f7.dialog.alert('Failed to save navigation changes');
        }
    }

    function markDirty() {
        isNavDirty.value = true;
    }

    function createNavItem() {
        f7.dialog.prompt('Enter label for new tab', (label) => {
            if (!label) return;

            const newItem: NavigationItem = {
                id: String(Date.now()),
                type: 'view',
                label: label,
                icon: 'square',
                view_id: ''
            };

            navigation.value.push(newItem);
            selectedNavKey.value = newItem.id;
            markDirty();
        });
    }

    function deleteNavItem(id: string) {
        f7.dialog.confirm('Delete this navigation item?', () => {
            navigation.value = navigation.value.filter(n => n.id !== id);
            
            if (selectedNavKey.value === id) {
                 selectedNavKey.value = '';
            }
            markDirty();
        });
    }

    function selectNavItem(id: string) {
        selectedNavKey.value = id;
    }

    function updateNavItem(id: string, updates: Partial<NavigationItem>) {
        const item = navigation.value.find(n => n.id === id);
        if (!item) return;
        
        Object.assign(item, updates);
        markDirty();
    }

    function onNavSort(event: { from: number; to: number }) {
        const { from, to } = event;
        if (from === to) return;

        const movedItem = navigation.value.splice(from, 1)[0];
        if (movedItem) {
            navigation.value.splice(to, 0, movedItem);
            markDirty();
        }
    }

    return {
        navigation,
        selectedNavKey,
        selectedNav,
        isNavDirty,
        fetchNavigation,
        saveNavigation,
        createNavItem,
        deleteNavItem,
        selectNavItem,
        updateNavItem,
        onNavSort
    };
}
