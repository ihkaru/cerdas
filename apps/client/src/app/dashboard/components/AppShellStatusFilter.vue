<template>
    <div class="filter-sticky-container">
        <!-- Search Bar with Actions -->
        <div class="search-wrapper display-flex align-items-center">
            <f7-searchbar :disable-button="false" placeholder="Cari data..." :clear-button="true" :value="searchQuery"
                @input="updateSearch($event.target.value)" @clear="updateSearch('')"
                class="searchbar-compact flex-shrink-1" inline>
            </f7-searchbar>

            <button type="button" class="action-button margin-left-half" @click="$emit('open-sort')" aria-label="Sort">
                <SvgIcon name="arrow_up_arrow_down" :size="18" />
            </button>
            
            <button type="button" class="action-button margin-left-half" @click="$emit('open-filter')" aria-label="Filter">
                <SvgIcon name="slider_horizontal_3" :size="18" />
                <span v-if="(activeFilterCount || 0) > 0" class="filter-badge">{{ activeFilterCount }}</span>
            </button>
        </div>

        <!-- Segmented Slider Control -->
        <div class="slider-wrapper">
            <div class="segmented-slider">
                <!-- Sliding Background Indicator -->
                <div class="slider-indicator" :style="indicatorStyle"></div>
                
                <!-- Segments -->
                <button type="button" 
                        class="segment-item" 
                        :class="{ active: statusFilter === 'all' }" 
                        @click="updateFilter('all')">
                    Semua <span class="count-badge">{{ counts.all }}</span>
                </button>
                <button type="button" 
                        class="segment-item" 
                        :class="{ active: statusFilter === 'assigned' }" 
                        @click="updateFilter('assigned')">
                    Pending <span class="count-badge">{{ counts.assigned }}</span>
                </button>
                <button type="button" 
                        class="segment-item" 
                        :class="{ active: statusFilter === 'in_progress' }" 
                        @click="updateFilter('in_progress')">
                    Proses <span class="count-badge">{{ counts.in_progress }}</span>
                </button>
                <button type="button" 
                        class="segment-item" 
                        :class="{ active: statusFilter === 'synced' }" 
                        @click="updateFilter('synced')">
                    Selesai <span class="count-badge">{{ counts.synced }}</span>
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import SvgIcon from '@/components/common/SvgIcon.vue';

const props = defineProps<{
    searchQuery: string;
    statusFilter: string;
    counts: { all: number; assigned: number; in_progress: number; synced: number; };
    activeFilterCount?: number;
}>();

const emit = defineEmits<{
    (e: 'update:searchQuery', value: string): void;
    (e: 'update:statusFilter', value: string): void;
    (e: 'open-sort'): void;
    (e: 'open-filter'): void;
}>();

const activeIndex = computed(() => {
    switch (props.statusFilter) {
        case 'all': return 0;
        case 'assigned': return 1;
        case 'in_progress': return 2;
        case 'synced': return 3;
        default: return 0;
    }
});

const indicatorStyle = computed(() => {
    return {
        transform: `translateX(calc(100% * ${activeIndex.value}))`
    };
});

const updateSearch = (val: string) => {
    emit('update:searchQuery', val);
};

const updateFilter = (val: any) => {
    emit('update:statusFilter', val);
};
</script>

<style scoped>
.filter-sticky-container {
    position: sticky;
    top: 0;
    z-index: 90;
    background: rgba(255, 255, 255, 0.8) !important;
    backdrop-filter: blur(16px) saturate(180%) !important;
    -webkit-backdrop-filter: blur(16px) saturate(180%) !important;
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
    padding-bottom: 6px;
}

.search-wrapper {
    padding: 10px 12px 6px 12px;
}

/* Customizing Framework7 searchbar inputs for premium aesthetics */
.searchbar-compact {
    --f7-searchbar-height: 38px;
    width: 100%;
}

:deep(.searchbar) {
    background: #f3f4f6 !important;
    border-radius: 12px !important;
    transition: background-color 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
    border: 1px solid transparent !important;
    box-shadow: none !important;
}

:deep(.searchbar.searchbar-enabled), :deep(.searchbar-focused) {
    background: #ffffff !important;
    border-color: rgba(33, 150, 243, 0.4) !important;
    box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1) !important;
}

:deep(.searchbar input) {
    background: transparent !important;
    border-radius: 12px !important;
    font-size: 14px !important;
    padding-left: 36px !important;
    color: #111827 !important;
}

:deep(.searchbar-icon) {
    opacity: 0.5;
}

/* Premium Rounded Action Buttons */
.action-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 38px;
    height: 38px;
    border-radius: 12px;
    color: #4b5563;
    background: #f3f4f6;
    border: none;
    cursor: pointer;
    transition: background-color 0.2s ease, color 0.2s ease, transform 0.1s ease;
    position: relative;
    -webkit-tap-highlight-color: transparent;
}

.action-button:active {
    background: #e5e7eb;
    color: #111827;
    transform: scale(0.95);
}

.filter-badge {
    position: absolute;
    top: -4px;
    right: -4px;
    background: #ef4444;
    color: white;
    font-size: 9px;
    font-weight: 700;
    min-width: 16px;
    height: 16px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid #ffffff;
    padding: 0 2px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

/* Segmented Slider Styles */
.slider-wrapper {
    padding: 2px 12px 6px 12px;
}

.segmented-slider {
    position: relative;
    display: flex;
    background: #f3f4f6;
    padding: 3px;
    border-radius: 12px;
    user-select: none;
    width: 100%;
    box-sizing: border-box;
}

.slider-indicator {
    position: absolute;
    top: 3px;
    bottom: 3px;
    left: 3px;
    width: calc(25% - 3px);
    background: #ffffff;
    border-radius: 9px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
    transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    z-index: 1;
}

.segment-item {
    position: relative;
    flex: 1;
    text-align: center;
    padding: 8px 0;
    font-size: 12px;
    font-weight: 500;
    color: #4b5563;
    cursor: pointer;
    z-index: 2;
    transition: color 0.25s ease, font-weight 0.25s ease;
    border-radius: 9px;
    outline: none;
    border: none;
    background: transparent;
    -webkit-tap-highlight-color: transparent;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
}

.segment-item.active {
    color: #111827;
    font-weight: 600;
}

.count-badge {
    font-size: 10px;
    background: rgba(0, 0, 0, 0.05);
    color: #6b7280;
    padding: 1px 5px;
    border-radius: 10px;
    transition: background-color 0.25s ease, color 0.25s ease;
}

.segment-item.active .count-badge {
    background: rgba(33, 150, 243, 0.1);
    color: var(--f7-theme-color, #2196f3);
}
</style>

