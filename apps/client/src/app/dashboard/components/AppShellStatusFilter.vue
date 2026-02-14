<template>
    <div class="filter-sticky-container bg-color-white">
        <!-- Search Bar with Actions -->
        <div class="search-wrapper display-flex align-items-center">
            <f7-searchbar :disable-button="false" placeholder="Cari..." :clear-button="true" :value="searchQuery"
                @input="updateSearch($event.target.value)" @clear="updateSearch('')"
                class="searchbar-compact flex-shrink-1" inline custom-search
                style="box-shadow: none; background: #E3F2FD; border-radius: 8px;">
            </f7-searchbar>

            <f7-link icon-f7="arrow_up_arrow_down" class="margin-left-half" @click="$emit('open-sort')"></f7-link>
            <f7-link icon-f7="slider_horizontal_3" class="margin-left-half" @click="$emit('open-filter')">
                <span v-if="(activeFilterCount || 0) > 0" class="badge color-red">{{ activeFilterCount }}</span>
            </f7-link>
        </div>

        <!-- Filter Chips -->
        <div class="filter-container">
            <f7-chip :class="{ 'chip-inactive': statusFilter !== 'all' }" color="blue" @click="updateFilter('all')">
                <span slot="text">Semua ({{ counts.all }})</span>
            </f7-chip>
            <f7-chip :class="{ 'chip-inactive': statusFilter !== 'assigned' }" color="orange"
                @click="updateFilter('assigned')">
                <span slot="text">Pending ({{ counts.assigned }})</span>
            </f7-chip>
            <f7-chip :class="{ 'chip-inactive': statusFilter !== 'in_progress' }" color="blue"
                @click="updateFilter('in_progress')">
                <span slot="text">Proses ({{ counts.in_progress }})</span>
            </f7-chip>
            <f7-chip :class="{ 'chip-inactive': statusFilter !== 'completed' }" color="green"
                @click="updateFilter('completed')">
                <span slot="text">Selesai ({{ counts.completed }})</span>
            </f7-chip>
        </div>
    </div>
</template>

<script setup lang="ts">
const props = defineProps<{
    searchQuery: string;
    statusFilter: string;
    counts: { all: number; assigned: number; in_progress: number; completed: number; };
    activeFilterCount?: number;
}>();

const emit = defineEmits<{
    (e: 'update:searchQuery', value: string): void;
    (e: 'update:statusFilter', value: string): void;
    (e: 'open-sort'): void;
    (e: 'open-filter'): void;
}>();

const updateSearch = (val: string) => {
    emit('update:searchQuery', val);
};

const updateFilter = (val: any) => {
    emit('update:statusFilter', val);
};
</script>

<style scoped>
.search-wrapper {
    padding: 8px 12px 4px 12px;
}

.searchbar-compact {
    --f7-searchbar-height: 36px;
    width: 100%;
}

.filter-container {
    display: flex;
    overflow-x: auto;
    padding: 4px 12px 8px 12px;
    gap: 6px;
    -ms-overflow-style: none;
    scrollbar-width: none;
}

.filter-sticky-container {
    position: sticky;
    top: 0;
    z-index: 100;
    background: var(--f7-page-bg-color, #fff);
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.filter-container::-webkit-scrollbar {
    display: none;
}

.chip-inactive {
    background-color: #f4f4f5 !important;
    color: #333 !important;
}
</style>
