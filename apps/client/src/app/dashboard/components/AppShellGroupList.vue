<template>
    <f7-list class="no-hairlines-between margin-top-half">
        <!-- Option to see ALL items at this level -->
        <f7-list-item link="#" @click="$emit('show-all')" class="group-item">
            <div slot="media" class="group-avatar"
                style="background-color: #f5f5f5; color: #555; border: 1px dashed #ccc;">
                <f7-icon f7="list_bullet" size="24px"></f7-icon>
            </div>
            <div slot="title" class="group-info">
                <div class="group-name">Lihat Semua Data</div>
                <div class="group-count">Tanpa Grouping</div>
            </div>
        </f7-list-item>

        <f7-list-item v-for="(group, idx) in groups" :key="idx" link="#"
            @click="$emit('enter-group', group.value || '')" class="group-item enter-animation"
            :style="{ animationDelay: `${idx * 0.05}s` }">
            <div slot="media" class="group-avatar" :style="getAvatarStyle(group.value || '')">
                {{ (group.value || '?').charAt(0).toUpperCase() }}
            </div>
            <div slot="title" class="group-info">
                <div class="group-name">{{ group.value || 'Data Lainnya' }}</div>
                <div class="group-stats-row">
                    <span v-if="group.assigned > 0" class="stat-pill orange">
                        {{ group.assigned }} Pending
                    </span>
                    <span v-if="group.in_progress > 0" class="stat-pill blue">
                        {{ group.in_progress }} Proses
                    </span>
                    <span v-if="group.completed > 0" class="stat-pill green">
                        {{ group.completed }} Selesai
                    </span>
                    <span class="stat-pill gray">
                        {{ group.count }} Total
                    </span>
                </div>
            </div>
        </f7-list-item>

        <f7-block v-if="groups.length === 0" class="text-align-center text-color-gray">
            <div style="opacity: 0.6; margin-top: 2rem;">
                <f7-icon f7="rectangle_stack" size="48px" color="gray"></f7-icon>
                <p>No groups found</p>
            </div>
        </f7-block>
    </f7-list>
</template>

<script setup lang="ts">
import { getAvatarStyle } from '../utils/avatarHelpers';

const props = defineProps<{
    groups: any[];
}>();



defineEmits<{
    (e: 'enter-group', value: string): void;
    (e: 'show-all'): void;
}>();
</script>

<style scoped>
@keyframes slideUpFade {
    from {
        opacity: 0;
        transform: translateY(15px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.enter-animation {
    opacity: 0;
    animation: slideUpFade 0.4s ease-out forwards;
}

.group-item :deep(.item-content) {
    padding-left: 16px;
    padding-right: 16px;
    min-height: 72px;
}

.group-avatar {
    border-radius: 50%;
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    font-weight: 600;
    margin-right: 16px;
    flex-shrink: 0;
}

.group-info {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
    text-align: left;
    width: 100%;
}

.group-name {
    font-weight: 600;
    font-size: 16px;
    color: #333;
    line-height: 1.2;
}

.group-count {
    font-size: 13px;
    color: #888;
    margin-top: 2px;
    line-height: 1.2;
}

.group-stats-row {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-top: 4px;
}

.stat-pill {
    font-size: 11px;
    padding: 2px 6px;
    border-radius: 4px;
    font-weight: 500;
}

.stat-pill.orange {
    background-color: #FFF3E0;
    color: #EF6C00;
}

.stat-pill.blue {
    background-color: #E3F2FD;
    color: #1976D2;
}

.stat-pill.green {
    background-color: #E8F5E9;
    color: #2E7D32;
}

.stat-pill.gray {
    background-color: #f5f5f5;
    color: #757575;
}

/* Force Framework7 Overrides */
.group-item :deep(.item-inner) {
    justify-content: flex-start !important;
    padding-top: 12px;
    padding-bottom: 12px;
}

.group-item :deep(.item-title) {
    flex-grow: 1;
    min-width: 0;
    margin-right: auto !important;
    width: 100%;
}
</style>
