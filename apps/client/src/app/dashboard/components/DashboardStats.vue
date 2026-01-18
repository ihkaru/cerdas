<template>
    <f7-block class="no-margin-bottom">
        <!-- Statistics Cards Row -->
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-value text-color-blue">{{ getStatCount('assigned') }}</div>
                <div class="stat-label">Pending</div>
            </div>
            <div class="stat-card">
                <div class="stat-value text-color-orange">{{ getStatCount('in_progress') }}</div>
                <div class="stat-label">In Progress</div>
            </div>
            <div class="stat-card">
                <div class="stat-value text-color-green">{{ getStatCount('completed') + getStatCount('synced') }}</div>
                <div class="stat-label">Completed</div>
            </div>
        </div>

        <!-- Progress Bar -->
        <div class="progress-section margin-top">
            <div class="display-flex justify-content-between margin-bottom-half">
                <span class="text-color-gray size-12">Progress</span>
                <span class="text-color-gray size-12 font-weight-bold">{{ progressPercent }}%</span>
            </div>
            <f7-progressbar :progress="progressPercent" color="green"></f7-progressbar>
        </div>

        <!-- Last Sync Info -->
        <div v-if="lastSyncTime" class="sync-info margin-top text-align-center">
            <f7-icon f7="clock" size="12" color="gray" class="margin-right-quarter"></f7-icon>
            <span class="text-color-gray size-11">Last sync: {{ lastSyncTime }}</span>
        </div>
    </f7-block>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
    stats: { status: string; count: number }[];
    total: number;
    lastSyncTime: string | null;
}>();

const getStatCount = (status: string): number => {
    const stat = props.stats.find(s => s.status === status);
    return stat?.count || 0;
};

const completedCount = computed(() => getStatCount('completed') + getStatCount('synced'));

const progressPercent = computed(() => {
    if (props.total === 0) return 0;
    return Math.round((completedCount.value / props.total) * 100);
});
</script>

<style scoped>
.stats-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
}

.stat-card {
    background: var(--f7-block-bg-color, #fff);
    border-radius: 12px;
    padding: 16px 8px;
    text-align: center;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.stat-value {
    font-size: 28px;
    font-weight: 700;
    line-height: 1;
}

.stat-label {
    font-size: 11px;
    color: var(--f7-text-color);
    opacity: 0.6;
    margin-top: 6px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.progress-section {
    padding: 0 4px;
}

.sync-info {
    display: flex;
    align-items: center;
    justify-content: center;
}
</style>
