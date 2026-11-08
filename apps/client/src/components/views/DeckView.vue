<template>
    <div class="deck-view-container height-100 overflow-auto">
        <f7-list media-list v-if="preparedData.length">
            <f7-list-item v-for="item in preparedData" :key="item.id || item.local_id" :class="[getStatusCardClass(item.status)]"
                :swipeout="hasSwipe" @click="$emit('click', item)" link="#">
                <template #title>
                    <span class="deck-title-text" data-inspect-target="views" :data-view-id="config.id || 'default'" data-inspect-option="primaryHeaderField">
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
                <p>Belum ada penugasan atau daftar isian responden yang cocok dengan kriteria filter saat ini.</p>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* Status Indicators & Soft Pastel Background Tints (Clean Color-Only) */
.status-card-assigned :deep(.item-content) {
    border-left: 5px solid #94a3b8 !important;
    background-color: #ffffff !important;
}

.status-card-in_progress :deep(.item-content) {
    border-left: 5px solid #0284c7 !important;
    background-color: #f0f9ff !important;
}

/* Mode Simple: Submitted = Selesai (Hijau) */
.status-card-submitted-simple :deep(.item-content),
.status-card-approved :deep(.item-content),
.status-card-synced :deep(.item-content),
.status-card-completed :deep(.item-content) {
    border-left: 5px solid #16a34a !important;
    background-color: #f0fdf4 !important;
}

/* Mode Complex: Submitted = Menunggu Review (Oranye/Amber) */
.status-card-submitted-complex :deep(.item-content) {
    border-left: 5px solid #f59e0b !important;
    background-color: #fffbeb !important;
}

/* Mode Complex: Rejected = Dikembalikan / Perlu Revisi (Merah) */
.status-card-rejected :deep(.item-content) {
    border-left: 5px solid #ef4444 !important;
    background-color: #fef2f2 !important;
}

.deck-title-text {
    font-weight: 600;
    color: #1e293b;
    font-size: 15px;
    line-height: 1.3;
}

.height-100 {
    height: 100%;
}

.overflow-auto {
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
}

/* Clean Empty State Styling */
.empty-state-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 32px 16px;
    min-height: 50vh;
}

.empty-state-card {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    padding: 24px 20px;
    text-align: center;
    max-width: 320px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
}

.empty-state-icon-bg {
    width: 56px;
    height: 56px;
    background-color: #f1f5f9;
    color: #64748b;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 16px auto;
}

.empty-state-card h3 {
    font-size: 16px;
    font-weight: 600;
    color: #0f172a;
    margin: 0 0 8px 0;
}

.empty-state-card p {
    font-size: 13px;
    color: #64748b;
    line-height: 1.5;
    margin: 0;
}

.animate-fade-in {
    animation: fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(6px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
</style>

<script setup lang="ts">
import AsyncImage from '../common/AsyncImage.vue';
import { computed } from 'vue';
import { useDeckData } from './deck/useDeckData';

const props = defineProps<{
    config: any;
    data: any[];
    contextId: string;
    actions?: any[];
    swipeConfig?: { left: string[]; right: string[] };
}>();

defineEmits(['click', 'action']);

const { options, preparedData, getImageUrl } = useDeckData(
    () => props.config,
    () => props.data,
    () => props.contextId
);

const isComplexMode = computed(() => {
    return props.config?.workflow_mode === 'complex' || props.config?.mode === 'complex';
});

const getStatusCardClass = (status?: string) => {
    const s = status || 'assigned';
    if (s === 'submitted') {
        return isComplexMode.value ? 'status-card-submitted-complex' : 'status-card-submitted-simple';
    }
    return `status-card-${s}`;
};

const getActionDef = (id: string) => {
    const action = props.actions?.find(a => a.id === id);
    if (!action) {
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
</script>
