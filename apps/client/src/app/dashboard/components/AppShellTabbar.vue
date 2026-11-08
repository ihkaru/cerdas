<template>
    <f7-toolbar position="bottom" :tabbar="true" :scrollable="scrollable" icons labels>
        <f7-link v-for="item in items" :key="getItemKey(item)"
            :tab-link="getTabLink(item)"
            :tab-link-active="isItemActive(item)"
            @click="handleClick(item)"
            :text="getItemText(item)"
            :icon-f7="getItemIcon(item)"
            data-inspect-target="navigation"
            :data-inspect-id="getItemInspectId(item)" />
    </f7-toolbar>
</template>

<script setup lang="ts">
import { getIcon } from '@/app/dashboard/utils/iconHelpers';

export interface TabItem {
    id?: string;
    label?: string;
    title?: string;
    type?: string;
    view_id?: string;
    view?: string;
    icon?: string;
    url?: string;
    [key: string]: unknown;
}

const props = withDefaults(defineProps<{
    items: TabItem[] | string[];
    activeView?: string;
    scrollable?: boolean;
    viewsMap?: Record<string, any>;
}>(), {
    activeView: '',
    scrollable: false,
    viewsMap: () => ({})
});

const emit = defineEmits<{
    (e: 'select-item', item: TabItem | string): void;
}>();

const getItemKey = (item: TabItem | string): string => {
    if (typeof item === 'string') return item;
    return `link-${item.id || item.label || item.view_id || item.view}`;
};

const getTargetView = (item: TabItem | string): string => {
    if (typeof item === 'string') return item;
    return String(item.view_id || item.view || item.id || '');
};

const getTabLink = (item: TabItem | string): string => {
    if (typeof item === 'string') return `#${item}`;
    if (item.type === 'view' || (!item.type && (item.view_id || item.view))) {
        return `#view-${item.view_id || item.view}`;
    }
    return 'true';
};

const isItemActive = (item: TabItem | string): boolean => {
    const target = getTargetView(item);
    return props.activeView === target;
};

const getItemText = (item: TabItem | string): string => {
    if (typeof item === 'string') {
        return props.viewsMap[item]?.title || item;
    }
    return item.label || item.title || '';
};

const getItemIcon = (item: TabItem | string): string => {
    if (typeof item === 'string') {
        return getIcon(props.viewsMap[item]?.type);
    }
    return item.icon || 'square';
};

const getItemInspectId = (item: TabItem | string): string | undefined => {
    if (typeof item === 'string') return item;
    return item.id ? String(item.id) : undefined;
};

const handleClick = (item: TabItem | string) => {
    emit('select-item', item);
};
</script>
