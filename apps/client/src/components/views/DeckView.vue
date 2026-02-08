<template>
    <f7-list media-list>
        <f7-list-item v-for="(item, idx) in data" :key="item.id || item.local_id"
            :class="[`status-border-${item.status}`, 'enter-animation']" :style="{ animationDelay: `${idx * 0.03}s` }"
            :title="resolvePath(item, options.title)" :subtitle="resolvePath(item, options.subtitle)"
            @click="$emit('click', item)" link="#">
            <template #media v-if="options.image">
                <img v-if="resolvePath(item, options.image)" :src="getImageUrl(resolvePath(item, options.image))"
                    width="44" height="44" style="border-radius: 4px; object-fit: cover;" />
                <!-- Empty White/Gray Box when no image -->
                <div v-else
                    style="width: 44px; height: 44px; background: #f5f5f5; border: 1px solid #ddd; border-radius: 4px;">
                </div>
            </template>
        </f7-list-item>
    </f7-list>
</template>

<style scoped>
/* Status Indicators */
.status-border-assigned :deep(.item-content) {
    border-left: 4px solid var(--f7-color-orange);
}

.status-border-in_progress :deep(.item-content) {
    border-left: 4px solid var(--f7-color-blue);
}

.status-border-completed :deep(.item-content) {
    border-left: 4px solid var(--f7-color-green);
}

/* Fallback for unknown/other */
:deep(.item-content) {
    padding-left: 12px !important;
    /* Adjust padding to compensate border */
}

/* Ensure border is visible */
:deep(.item-inner) {
    padding-left: 8px;
}

/* Staggered slide-up animation for list items */
@keyframes slideUpFade {
    from {
        opacity: 0;
        transform: translateY(12px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.enter-animation {
    opacity: 0;
    animation: slideUpFade 0.35s ease-out forwards;
}
</style>

<script setup lang="ts">
import { apiClient } from '@/common/api/ApiClient';
import { computed } from 'vue';

const props = defineProps<{
    config: any;
    data: any[];
}>();

defineEmits(['click']);

// Normalize options to support both old and new config formats
const options = computed(() => {
    // Check if we received the full View Object (which has a .config property) OR just the config object
    const realConfig = props.config?.config || props.config;

    if (props.data && props.data.length > 0) {
        console.log('[DeckView] First Item:', props.data[0]);
        console.log('[DeckView] Raw Config:', props.config);
        console.log('[DeckView] Real Config:', realConfig);
    }

    const deckConfig = realConfig?.deck || realConfig?.options || {};

    return {
        title: deckConfig.primaryHeaderField || deckConfig.title_column,
        subtitle: deckConfig.secondaryHeaderField || deckConfig.subtitle_column,
        image: deckConfig.imageField || deckConfig.image_column,
    };
});

// Helper to get nested data (e.g. 'prelist_data.name')
const resolvePath = (obj: any, path: string) => {
    if (!path) return '';

    // Constants
    if (path === 'house_photo') {
        // Debug specific path
    }

    // 0. Inner Helper for robust deep access
    const getDeep = (target: any, p: string) => {
        return p.split('.').reduce((o, i) => (o ? o[i] : undefined), target);
    };

    // 1. Try direct path lookup (e.g. 'status', 'id')
    const directValue = getDeep(obj, path);
    if (directValue !== undefined && directValue !== null) return directValue;

    // 2. Try searching in response_data (HIGHEST PRIORITY for form fields)
    let responseData = obj.response_data;
    if (typeof responseData === 'string') {
        try { responseData = JSON.parse(responseData); } catch (e) { responseData = {}; }
    }

    // Check deep path in response_data
    if (responseData && typeof responseData === 'object') {
        const val = getDeep(responseData, path);
        if (val !== undefined && val !== null) return val;
    }

    // 3. Try searching in prelist_data (Data source default)
    let prelistData = obj.prelist_data;
    if (typeof prelistData === 'string') {
        try { prelistData = JSON.parse(prelistData); } catch (e) { prelistData = {}; }
    }

    if (prelistData && typeof prelistData === 'object') {
        const val = getDeep(prelistData, path);
        if (val !== undefined && val !== null) return val;
    }

    // 4. Debug Result (Transparent Logging)
    const result = (responseData && typeof responseData === 'object' && getDeep(responseData, path)) ||
        (prelistData && typeof prelistData === 'object' && getDeep(prelistData, path));

    return result;
};

const getImageUrl = (path: string) => {
    if (!path) return '';
    const url = apiClient.getAssetUrl(path);
    // Don't append timestamp to data URIs or Blobs
    if (url.startsWith('data:') || url.startsWith('blob:')) return url;
    return url + '?t=' + Date.now();
};
</script>
