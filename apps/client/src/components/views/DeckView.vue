<template>
    <div class="deck-view-container height-100 overflow-auto">
        <f7-list media-list>
            <f7-list-item v-for="item in data" :key="item.id || item.local_id" :class="[`status-border-${item.status}`]"
                :swipeout="hasSwipe" :title="resolvePath(item, options.title)"
                :subtitle="resolvePath(item, options.subtitle)" @click="$emit('click', item)" link="#">
                <template #media v-if="options.image">
                    <img v-if="resolvePath(item, options.image)" :src="getImageUrl(resolvePath(item, options.image))"
                        width="44" height="44" style="border-radius: 4px; object-fit: cover;" />
                    <!-- Empty White/Gray Box when no image -->
                    <div v-else
                        style="width: 44px; height: 44px; background: #f5f5f5; border: 1px solid #ddd; border-radius: 4px;">
                    </div>
                </template>

                <!-- Swipe Left Actions -->
                <f7-swipeout-actions left v-if="leftSwipeActions.length">
                    <f7-swipeout-button v-for="action in leftSwipeActions" :key="action.id"
                        :color="action.color || 'blue'" @click="$emit('action', action.id, item)">
                        <f7-icon :f7="action.icon" />
                    </f7-swipeout-button>
                </f7-swipeout-actions>

                <!-- Swipe Right Actions -->
                <f7-swipeout-actions right v-if="rightSwipeActions.length">
                    <f7-swipeout-button v-for="action in rightSwipeActions" :key="action.id"
                        :color="action.color || 'blue'" @click="$emit('action', action.id, item)">
                        <f7-icon :f7="action.icon" />
                    </f7-swipeout-button>
                </f7-swipeout-actions>
            </f7-list-item>
        </f7-list>
    </div>
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

/* Ensure border is visible */
:deep(.item-inner) {
    padding-left: 8px;
}
</style>

<script setup lang="ts">
import { apiClient } from '@/common/api/ApiClient';
import { computed } from 'vue';

const props = defineProps<{
    config: any;
    data: any[];
    actions?: any[];
    swipeConfig?: { left: string[]; right: string[] };
}>();

defineEmits(['click', 'action']);




const getActionDef = (id: string) => {
    const action = props.actions?.find(a => a.id === id);
    if (!action) {
        // Only warn in development
        if (import.meta.env.DEV) {
            console.warn(`[DeckView] Action not found for ID: ${id}. hiding.`);
        }
        return null;
    }
    return action;
};

const leftSwipeActions = computed(() => {
    const config = props.swipeConfig?.left || [];
    return config.map(id => getActionDef(id)).filter(a => a !== null);
});

const rightSwipeActions = computed(() => {
    const config = props.swipeConfig?.right || [];
    return config.map(id => getActionDef(id)).filter(a => a !== null);
});

const hasSwipe = computed(() => leftSwipeActions.value.length > 0 || rightSwipeActions.value.length > 0);

// Normalize options to support both old and new config formats
const options = computed(() => {
    // Check if we received the full View Object (which has a .config property) OR just the config object
    const realConfig = props.config?.config || props.config;

    const deckConfig = realConfig?.deck || realConfig?.options || {};

    return {
        title: deckConfig.primaryHeaderField || deckConfig.title_column,
        subtitle: deckConfig.secondaryHeaderField || deckConfig.subtitle_column,
        image: deckConfig.imageField || deckConfig.image_column,
    };
});

// Helper to safely parse JSON if needed
const ensureObject = (data: any) => {
    if (typeof data === 'string') {
        try { return JSON.parse(data); }
        catch {
            // Ignore parse error
            return {};
        }
    }
    return (typeof data === 'object' && data !== null) ? data : {};
};

// Helper to get nested data (e.g. 'prelist_data.name')
const resolvePath = (obj: any, path: string) => {
    if (!path) return '';

    // 0. Inner Helper for robust deep access
    const getDeep = (target: any, p: string) => {
        if (!target) return undefined;
        return p.split('.').reduce((o, i) => (o ? o[i] : undefined), target);
    };

    // 1. Try direct path lookup (e.g. 'status', 'id')
    const directValue = getDeep(obj, path);
    if (directValue !== undefined && directValue !== null) return directValue;

    // 2. Try searching in response_data (HIGHEST PRIORITY for form fields)
    const responseData = ensureObject(obj.response_data);
    const responseVal = getDeep(responseData, path);
    if (responseVal !== undefined && responseVal !== null) return responseVal;

    // 3. Try searching in prelist_data (Data source default)
    const prelistData = ensureObject(obj.prelist_data);
    const prelistVal = getDeep(prelistData, path);
    if (prelistVal !== undefined && prelistVal !== null) return prelistVal;

    return '';
};

const getImageUrl = (path: string) => {
    if (!path) return '';
    const url = apiClient.getAssetUrl(path);
    // Don't append timestamp to data URIs or Blobs
    if (url.startsWith('data:') || url.startsWith('blob:')) return url;
    return url + '?t=' + Date.now();
};
</script>
