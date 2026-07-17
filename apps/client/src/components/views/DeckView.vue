<template>
    <div class="deck-view-container height-100 overflow-auto">
        <f7-list media-list v-if="preparedData.length">
            <f7-list-item v-for="item in preparedData" :key="item.id || item.local_id" :class="[`status-border-${item.status}`]"
                :swipeout="hasSwipe" @click="$emit('click', item)" link="#">
                <template #title>
                    <span data-inspect-target="views" :data-view-id="config.id || 'default'" data-inspect-option="primaryHeaderField">
                        {{ item._resolvedTitle }}
                    </span>
                </template>
                <template #subtitle>
                    <span data-inspect-target="views" :data-view-id="config.id || 'default'" data-inspect-option="secondaryHeaderField">
                        {{ item._resolvedSubtitle }}
                    </span>
                </template>
                <template #media v-if="options.image">
                    <div data-inspect-target="views" :data-view-id="config.id || 'default'" data-inspect-option="imageField" style="display: inline-block;">
                        <AsyncImage 
                            v-if="item._resolvedImage" 
                            :src="getImageUrl(item, item._resolvedImage)"
                            :width="44" 
                            :height="44" 
                            loading="lazy" 
                        />
                        <!-- Fallback box if resolve path is truly empty -->
                        <div v-else
                            style="width: 44px; height: 44px; background: #f5f5f5; border: 1px solid #ddd; border-radius: 4px;">
                        </div>
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
        
        <div v-else class="empty-state-wrapper animate-fade-in">
            <div class="empty-state-card">
                <div class="empty-state-icon-bg">
                    <f7-icon f7="square_list" size="28" />
                </div>
                <h3>Belum Ada Daftar Isian</h3>
                <p>Belum ada penugasan atau daftar isian data yang ditugaskan ke Anda saat ini.</p>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* Status Indicators */
.status-border-assigned :deep(.item-content) {
    border-left: 4px solid var(--f7-color-gray);
}

.status-border-in_progress :deep(.item-content) {
    border-left: 4px solid var(--f7-color-blue);
}

.status-border-submitted :deep(.item-content) {
    border-left: 4px solid var(--f7-color-orange);
}

.status-border-approved :deep(.item-content),
.status-border-synced :deep(.item-content),
.status-border-completed :deep(.item-content) {
    border-left: 4px solid var(--f7-color-teal);
}

.status-border-rejected :deep(.item-content) {
    border-left: 4px solid var(--f7-color-red);
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

/* Empty State Styling */
.empty-state-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    min-height: 350px;
    padding: 32px 16px;
    box-sizing: border-box;
}

.empty-state-card {
    text-align: center;
    max-width: 280px;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.empty-state-icon-bg {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: #f1f5f9;
    color: #64748b;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 16px;
}

.empty-state-card h3 {
    font-size: 15px;
    font-weight: 600;
    color: #334155;
    margin: 0 0 8px 0;
}

.empty-state-card p {
    font-size: 12px;
    color: #64748b;
    margin: 0;
    line-height: 1.5;
}

.animate-fade-in {
    animation: fadeIn 0.4s ease-out forwards;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(8px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
</style>

<script setup lang="ts">
/* eslint-disable */
import { apiClient } from '@/common/api/ApiClient';
import AsyncImage from '../common/AsyncImage.vue';
import { computed } from 'vue';
import { statusLabel } from '@/app/dashboard/utils/statusHelpers';


const props = defineProps<{
    config: any;
    data: any[];
    contextId: string;
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
    // Utility to find a block containing any of the target keys, digging into .config/options
    const findBlock = (root: any, targetKeys: string[]): any => {
        if (!root || typeof root !== 'object') return null;
        if (targetKeys.some(k => k in root)) return root;
        if (root.deck) return root.deck; // Fast path for deck
        if (root.config) return findBlock(root.config, targetKeys);
        if (root.options) return findBlock(root.options, targetKeys);
        return null;
    };

    const targetKeys = ['primaryHeaderField', 'title_column', 'imageField', 'image_column'];
    const deck = findBlock(props.config, targetKeys) || {};

    const title = deck.primaryHeaderField || deck.title_column;
    const subtitle = deck.secondaryHeaderField || deck.subtitle_column;
    const image = deck.imageField || deck.image_column;

    return { title, subtitle, image };
});

/**
 * PREPARED DATA PATTERN
 * Parsing JSON and resolving paths once per data change, 
 * instead of hundreds of times per render frame.
 */
const preparedData = computed(() => {
    const opts = options.value;
    console.log('[DIAGNOSTIC] DeckView Options:', opts);
    console.log('[DIAGNOSTIC] DeckView First Raw Item:', props.data?.[0]);

    const result = (props.data || []).map(item => {
        // Memoize parsed objects
        const responseData = ensureObject(item.response_data);
        const prelistData = ensureObject(item.prelist_data);
        
        const resolvedTitle = resolvePath(item, responseData, prelistData, opts.title);
        const resolvedSubtitle = resolvePath(item, responseData, prelistData, opts.subtitle);

        // Return rich object with pre-resolved fields
        return {
            ...item,
            _parsedResponse: responseData,
            _parsedPrelist: prelistData,
            _resolvedTitle: resolvedTitle,
            _resolvedSubtitle: resolvedSubtitle,
            _resolvedImage: resolvePath(item, responseData, prelistData, opts.image)
        };
    });

    console.log('[DIAGNOSTIC] DeckView First Prepared Item:', result[0]);
    return result;
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

// Helper (Optimized to use already-parsed objects)
const resolvePath = (obj: any, responseData: any, prelistData: any, path: string) => {
    if (!path) return '';

    // 0. Inner Helper for robust deep access
    const getDeep = (target: any, p: string) => {
        if (!target || !p) return undefined;
        return p.split('.').reduce((o, i) => (o ? o[i] : undefined), target);
    };

    // Standard field prefixes
    const prefixes = ['prelist_data.', 'response_data.', 'data.'];
    let cleanPath = path;
    for (const prefix of prefixes) {
        if (path.startsWith(prefix)) {
            cleanPath = path.substring(prefix.length);
            break;
        }
    }

    // 1. Try direct path lookup (e.g. 'status', 'id', or the clean path on the root)
    const directValue = getDeep(obj, cleanPath);
    if (directValue !== undefined && directValue !== null && directValue !== '') {
        return cleanPath === 'status' ? statusLabel(String(directValue)) : directValue;
    }

    // 2. Try searching in response_data (HIGHEST PRIORITY for form fields)
    const responseVal = getDeep(responseData, cleanPath);
    if (responseVal !== undefined && responseVal !== null && responseVal !== '') {
        return cleanPath === 'status' ? statusLabel(String(responseVal)) : responseVal;
    }

    // 3. Try searching in prelist_data (For prefilled/imported columns)
    const prelistVal = getDeep(prelistData, cleanPath);
    if (prelistVal !== undefined && prelistVal !== null && prelistVal !== '') {
        return cleanPath === 'status' ? statusLabel(String(prelistVal)) : prelistVal;
    }

    // 4. Try smart fallbacks for standard unconfigured/default keys
    const lowerPath = cleanPath.toLowerCase();
    if (lowerPath === 'name' || lowerPath === 'title' || lowerPath === 'nama' || lowerPath === 'judul') {
        const headerCandidates = ['name', 'nama', 'title', 'judul', 'label', 'id'];
        for (const candidate of headerCandidates) {
            if (candidate === cleanPath) continue; // Skip already tried
            const val = getDeep(responseData, candidate) ?? getDeep(prelistData, candidate) ?? getDeep(obj, candidate);
            if (val !== undefined && val !== null && val !== '') return val;
        }
    } else if (lowerPath === 'description' || lowerPath === 'deskripsi' || lowerPath === 'address' || lowerPath === 'alamat') {
        const bodyCandidates = ['description', 'deskripsi', 'address', 'alamat', 'location', 'lokasi', 'status'];
        for (const candidate of bodyCandidates) {
            if (candidate === cleanPath) continue; // Skip already tried
            const val = getDeep(responseData, candidate) ?? getDeep(prelistData, candidate) ?? getDeep(obj, candidate);
            if (val !== undefined && val !== null && val !== '') {
                return candidate === 'status' ? statusLabel(String(val)) : val;
            }
        }
    }

    return '';

};

const getImageUrl = (item: any, path: string) => {
    if (!path) return '';
    
    // 1. If it's already a full URL or data URI, return as is
    if (path.startsWith('http') || path.startsWith('data:') || path.startsWith('blob:')) {
        return path;
    }

    // 2. Smart Resolve for Response Images
    // If the path doesn't contain a directory separator, it's likely a bare filename
    // We need to prepend 'responses/{app_uuid}/{assignment_id}/'
    let finalPath = path;
    if (!path.includes('/')) {
        // Use the contextId (which is the appId/uuid) and assignment uuid/id
        const assignmentId = item.uuid || item.id;
        finalPath = `responses/${props.contextId}/${assignmentId}/${path}`;
    }

    return apiClient.getAssetUrl(finalPath);
};
</script>
