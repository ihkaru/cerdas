<template>
    <div class="group-list-container">
        <!-- Interactive Breadcrumb Trail -->
        <AppShellBreadcrumbs 
            :group-path="groupPath" 
            @navigate-up="$emit('navigate-up')"
            @navigate-level="(lvl) => $emit('navigate-level', lvl)" 
        />

        <!-- Group Items List -->
        <f7-list class="no-hairlines-between margin-top-half group-f7-list">
            <!-- Option to see ALL items at this level -->
            <f7-list-item link="#" @click="$emit('show-all')" class="group-item root-show-all-item">
                <template #media>
                    <div class="group-avatar all-data-avatar">
                        <f7-icon f7="list_bullet" size="22px"></f7-icon>
                    </div>
                </template>
                <template #title>
                    <div class="group-info">
                        <div class="group-name">Lihat Semua Data</div>
                        <div class="group-count">Tampilkan seluruh kartu responden langsung</div>
                    </div>
                </template>
                <template #after>
                    <f7-icon f7="chevron_right" size="16px" color="gray" class="group-chevron"></f7-icon>
                </template>
            </f7-list-item>

            <f7-list-item v-for="(group, idx) in groups" :key="idx" link="#"
                @click="$emit('enter-group', group.value || '')" class="group-item enter-animation"
                :style="{ animationDelay: `${idx * 0.04}s` }">
                <template #media>
                    <div class="group-avatar" :style="getAvatarStyle(group.value || '')">
                        {{ (group.value || '?').charAt(0).toUpperCase() }}
                    </div>
                </template>
                <template #title>
                    <div class="group-info">
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
                </template>
                <template #after>
                    <f7-icon f7="chevron_right" size="16px" color="gray" class="group-chevron"></f7-icon>
                </template>
            </f7-list-item>

            <!-- Resilient & Helpful Empty State -->
            <AppShellGroupEmptyState 
                v-if="groups.length === 0" 
                :current-level="currentLevel" 
                :total-count="totalCount"
                @navigate-up="$emit('navigate-up')"
                @show-all="$emit('show-all')"
            />
        </f7-list>
    </div>
</template>

<script setup lang="ts">
import { getAvatarStyle } from '../utils/avatarHelpers';
import AppShellBreadcrumbs from './AppShellBreadcrumbs.vue';
import AppShellGroupEmptyState from './AppShellGroupEmptyState.vue';

interface GroupItem {
    value: string;
    count: number;
    assigned: number;
    in_progress: number;
    completed: number;
}

withDefaults(defineProps<{
    groups: GroupItem[];
    config?: any;
    currentLevel?: number;
    groupPath?: string[];
    currentField?: string | null;
    totalCount?: number;
}>(), {
    currentLevel: 0,
    groupPath: () => [],
    currentField: null,
    totalCount: 0
});

defineEmits<{
    (e: 'enter-group', value: string): void;
    (e: 'show-all'): void;
    (e: 'navigate-up'): void;
    (e: 'navigate-level', index: number): void;
}>();
</script>

<style scoped>
@keyframes slideUpFade {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
}

.enter-animation {
    opacity: 0;
    animation: slideUpFade 0.3s ease-out forwards;
}

/* Item styling */
.group-f7-list {
    margin-top: 4px !important;
}

.group-item :deep(.item-content) {
    padding-left: 14px;
    padding-right: 14px;
    min-height: 64px;
}

.all-data-avatar {
    background-color: #f1f5f9 !important;
    color: #475569 !important;
    border: 1px dashed #cbd5e1 !important;
}

.group-avatar {
    border-radius: 50%;
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    font-weight: 600;
    margin-right: 14px;
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
    font-size: 15px;
    color: #1e293b;
    line-height: 1.2;
}

.group-count {
    font-size: 12px;
    color: #64748b;
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
    font-size: 10px;
    padding: 1px 6px;
    border-radius: 4px;
    font-weight: 500;
}

.stat-pill.orange { background-color: #FFF3E0; color: #EF6C00; }
.stat-pill.blue { background-color: #E3F2FD; color: #1976D2; }
.stat-pill.green { background-color: #E8F5E9; color: #2E7D32; }
.stat-pill.gray { background-color: #f1f5f9; color: #64748b; }

.group-chevron {
    opacity: 0.4;
    margin-left: 4px;
}

/* Force Framework7 Overrides */
.group-item :deep(.item-inner) {
    justify-content: flex-start !important;
    padding-top: 10px;
    padding-bottom: 10px;
}

.group-item :deep(.item-title) {
    flex-grow: 1;
    min-width: 0;
    margin-right: auto !important;
    width: 100%;
}
</style>
