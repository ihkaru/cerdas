<template>
    <div class="list-container flex-grow-1 overflow-auto bg-color-white">
        <f7-block-title>
            Lokasi ({{ validLocations.length }})
            <span v-if="validLocations.length > 50" class="text-color-gray size-12 font-normal margin-left-half">
                (Menampilkan 50 teratas)
            </span>
        </f7-block-title>
        <f7-list media-list>
            <f7-list-item v-for="item in displayedListItems" :key="item.id || item.local_id"
                :title="resolvePath(item, normalizedConfig.label) || resolvePath(item, normalizedConfig.popup_title) || 'Untitled'"
                :subtitle="resolvePath(item, normalizedConfig.subtitle) || resolvePath(item, normalizedConfig.popup_subtitle) || ''"
                @click="emit('focus-item', item)" link="#">
                <template #media>
                    <div class="list-color-dot" :style="{ background: resolveColor(getMarkerStyle(item).color) }">
                    </div>
                </template>
            </f7-list-item>
            <f7-list-item v-if="validLocations.length > 50">
                <div class="text-align-center width-100 padding text-color-gray">
                    Gunakan pencarian untuk memfilter hasil list.
                </div>
            </f7-list-item>
        </f7-list>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { resolveColor } from '../utils/mapColorResolver';
import { resolvePath } from '../utils/mapCoordinates';

const props = defineProps<{
    validLocations: any[];
    normalizedConfig: any;
    markerStyleFn: any;
}>();

const emit = defineEmits<{
    (e: 'focus-item', item: any): void;
}>();

// LIMIT LIST RENDERING TO PREVENT DOM FREEZE
const displayedListItems = computed(() => {
    return props.validLocations.slice(0, 50);
});

const getMarkerStyle = (item: any) => {
    const defaultStyle = { icon: 'location_fill', color: 'blue' };
    if (!props.markerStyleFn) return defaultStyle;
    try {
        const data = item.response_data || item.data || {};
        const result = props.markerStyleFn(data, item);
        return {
            icon: result?.icon || defaultStyle.icon,
            color: result?.color || defaultStyle.color
        };
    } catch {
        return defaultStyle;
    }
};
</script>

<style scoped>
/* List color dot */
.list-color-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    border: 2px solid #fff;
    box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1);
    flex-shrink: 0;
}
</style>
