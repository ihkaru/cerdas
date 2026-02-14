<template>
    <f7-block class="stats-block no-margin-bottom">

        <!-- Statistics Cards -->
        <div class="stats-grid">
            <div class="stat-card stat-card--pending">
                <div class="stat-card-inner">
                    <f7-icon f7="clock_fill" size="16" class="stat-icon"></f7-icon>
                    <div class="stat-value">{{ getStatCount('assigned') }}</div>
                    <div class="stat-label">Pending</div>
                </div>
            </div>
            <div class="stat-card stat-card--progress">
                <div class="stat-card-inner">
                    <f7-icon f7="arrow_right_circle_fill" size="16" class="stat-icon"></f7-icon>
                    <div class="stat-value">{{ getStatCount('in_progress') }}</div>
                    <div class="stat-label">In Progress</div>
                </div>
            </div>
            <div class="stat-card stat-card--done">
                <div class="stat-card-inner">
                    <f7-icon f7="checkmark_circle_fill" size="16" class="stat-icon"></f7-icon>
                    <div class="stat-value">{{ completedCount }}</div>
                    <div class="stat-label">Completed</div>
                </div>
            </div>
        </div>

        <!-- Progress Section -->
        <div class="progress-section">
            <div class="progress-header">
                <span class="progress-label">Overall Progress</span>
                <span class="progress-pct">{{ progressPercent }}%</span>
            </div>
            <div class="progress-track">
                <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
            </div>
            <div class="progress-footer">
                <span>{{ completedCount }} of {{ total }} completed</span>
            </div>
        </div>

        <!-- Last Sync -->
        <div v-if="lastSyncTime" class="sync-info">
            <div class="sync-dot"></div>
            <span>Synced {{ lastSyncTime }}</span>
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
    return props.stats.find(s => s.status === status)?.count ?? 0;
};

const completedCount = computed(() =>
    getStatCount('completed') + getStatCount('synced')
);

const progressPercent = computed(() => {
    if (props.total === 0) return 0;
    return Math.round((completedCount.value / props.total) * 100);
});
</script>

<style scoped>
.stats-block {
    padding: 0 16px;
}

/* ── Grid ── */
.stats-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    margin-bottom: 16px;
}

/* ── Cards ── */
.stat-card {
    border-radius: 14px;
    padding: 14px 8px 12px;
    text-align: center;
    position: relative;
    overflow: hidden;
    border: 1px solid transparent;
}

.stat-card-inner {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
}

.stat-card--pending {
    background: rgba(0, 122, 255, 0.07);
    border-color: rgba(0, 122, 255, 0.15);
}

.stat-card--pending .stat-icon,
.stat-card--pending .stat-value {
    color: #007AFF;
}

.stat-card--progress {
    background: rgba(255, 149, 0, 0.07);
    border-color: rgba(255, 149, 0, 0.15);
}

.stat-card--progress .stat-icon,
.stat-card--progress .stat-value {
    color: #FF9500;
}

.stat-card--done {
    background: rgba(52, 199, 89, 0.07);
    border-color: rgba(52, 199, 89, 0.15);
}

.stat-card--done .stat-icon,
.stat-card--done .stat-value {
    color: #34C759;
}

.stat-icon {
    opacity: 0.8;
    margin-bottom: 2px;
}

.stat-value {
    font-size: 26px;
    font-weight: 700;
    line-height: 1;
    letter-spacing: -0.5px;
}

.stat-label {
    font-size: 10px;
    font-weight: 500;
    color: var(--f7-label-color);
    opacity: 0.7;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    margin-top: 2px;
}

/* ── Progress ── */
.progress-section {
    background: var(--f7-block-bg-color, rgba(0, 0, 0, 0.03));
    border-radius: 14px;
    padding: 14px 16px;
    border: 1px solid rgba(0, 0, 0, 0.06);
    margin-bottom: 10px;
}

.progress-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
}

.progress-label {
    font-size: 12px;
    font-weight: 600;
    color: var(--f7-text-color);
    opacity: 0.7;
}

.progress-pct {
    font-size: 13px;
    font-weight: 700;
    color: #34C759;
}

.progress-track {
    width: 100%;
    height: 7px;
    background: rgba(52, 199, 89, 0.15);
    border-radius: 99px;
    overflow: hidden;
}

.progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #34C759, #30D158);
    border-radius: 99px;
    transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.progress-footer {
    margin-top: 8px;
    font-size: 11px;
    color: var(--f7-label-color);
    opacity: 0.6;
    text-align: right;
}

/* ── Sync Info ── */
.sync-info {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    font-size: 11px;
    color: var(--f7-label-color);
    opacity: 0.5;
    padding-bottom: 4px;
}

.sync-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #34C759;
    flex-shrink: 0;
}
</style>