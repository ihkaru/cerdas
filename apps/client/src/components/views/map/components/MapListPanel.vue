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
                @click="emit('focus-item', item)" link="#"
                :class="{ 'font_weight_bold': getMarkerStyle(item).bold }">
                <template #media>
                    <div class="list-marker-wrapper">
                        <div class="list-color-dot" :style="{ background: resolveColor(getMarkerStyle(item).color) }">
                            <f7-icon v-if="getMarkerStyle(item).icon && getMarkerStyle(item).icon !== 'circle'" 
                                :f7="resolveIcon(getMarkerStyle(item).icon)" size="8" color="white"></f7-icon>
                        </div>
                    </div>
                </template>
                <template #title>
                    <div :style="{ color: getMarkerStyle(item).text_color || 'inherit' }">
                        {{ resolvePath(item, normalizedConfig.label) || resolvePath(item, normalizedConfig.popup_title) || 'Untitled' }}
                    </div>
                </template>
                <template #subtitle>
                    {{ resolvePath(item, normalizedConfig.subtitle) || resolvePath(item, normalizedConfig.popup_subtitle) || '' }}
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
import { evaluate } from '@cerdas/form-engine';
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

// Shared context per render cycle for Advanced JS
const evalContext = computed(() => ({
    items: props.validLocations,
    cache: {}
}));

/* eslint-disable-next-line sonarjs/cognitive-complexity */
const getMarkerStyle = (item: any) => {
    const mapConfig = props.normalizedConfig;
    const defaultStyle = { icon: 'circle', color: 'orange', bold: false, text_color: '' };
    
    const data = item.response_data || item.data || {};
    const style = { ...defaultStyle };

    // 1. Format Rules (Simple UI)
    const rules = mapConfig.format_rules || [];
    for (const rule of rules) {
        try {
            if (evaluate(rule.condition, { row: data, item, ctx: evalContext.value })) {
                if (rule.style?.color) style.color = rule.style.color;
                if (rule.style?.icon) style.icon = rule.style.icon;
                if (rule.style?.bold) style.bold = true;
                if (rule.style?.text_color) style.text_color = resolveColor(rule.style.text_color);
                break; // First match wins
            }
        } catch { /* ignore */ }
    }

    // 2. markerStyleFn (Advanced JS) if exists
    if (props.markerStyleFn) {
        try {
            const result = props.markerStyleFn(data, item, evalContext.value);
            if (result?.color) style.color = result.color;
            if (result?.icon) style.icon = result.icon;
            if (result?.bold) style.bold = true;
        } catch { /* ignore */ }
    }

    return style;
};

const resolveIcon = (icon: string) => {
    const map: Record<string, string> = {
        'pin': 'location_fill',
        'star': 'star_fill',
        'flag': 'flag_fill',
        'check': 'checkmark_circle_fill'
    };
    return map[icon] || icon;
};
</script>

<style scoped>
/* List marker wrapper for alignment */
.list-marker-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
}

/* List color dot */
.list-color-dot {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    border: 2px solid #fff;
    box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1);
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
}

/* Helper for bold text */
.font_weight_bold {
    --f7-list-item-title-font-weight: 700;
}
</style>
