<template>
    <div class="filter-sticky-container bg-color-white">
        <!-- Search Bar -->
        <div class="search-wrapper">
            <f7-searchbar :disable-button="false" placeholder="Cari..." :clear-button="true" :value="searchQuery"
                @input="updateSearch($event.target.value)" @clear="updateSearch('')" class="searchbar-compact" inline
                custom-search style="box-shadow: none; background: #E3F2FD; border-radius: 8px;">
            </f7-searchbar>
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
}>();

const emit = defineEmits<{
    (e: 'update:searchQuery', value: string): void;
    (e: 'update:statusFilter', value: string): void;
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
