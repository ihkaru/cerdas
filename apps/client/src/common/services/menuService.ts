import { ref } from 'vue';

export interface MenuData {
    tables: any[];
    navigation: any[];
    views: any[];
    contextId: string;
    currentUserRole: string;
    user: any;
    appVersion: string;
    buildTimestamp: string;
}

export const globalPanelOpened = ref(false);
export const activeMenuData = ref<MenuData | null>(null);

export function openMenu(data: MenuData) {
    activeMenuData.value = data;
    globalPanelOpened.value = true;
}

export function closeMenu() {
    globalPanelOpened.value = false;
}
