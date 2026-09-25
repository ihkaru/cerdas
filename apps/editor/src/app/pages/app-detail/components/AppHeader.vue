<template>
    <div class="page-header">
        <div class="header-left">
            <f7-link back icon-f7="chevron_left" class="back-btn" />
            <div class="app-avatar" :style="{ background: app.color }">
                {{ app.name.substring(0, 2).toUpperCase() }}
            </div>
            <div class="header-info">
                <div class="title-row">
                    <h1>{{ app.name }}</h1>
                    <f7-chip :text="app.mode" :color="app.mode === 'complex' ? 'purple' : 'blue'" outline
                        class="mode-badge" />
                </div>
                <p>{{ app.description || 'No description' }}</p>
            </div>
        </div>
        <div class="header-actions">
            <!-- <f7-button outline class="settings-btn">
                <f7-icon f7="gear" />
                Settings
            </f7-button> -->
            <f7-button fill @click="$emit('edit')" class="edit-btn">
                <f7-icon f7="square_pencil" />
                Open Editor
            </f7-button>
        </div>
    </div>
</template>
<script setup lang="ts">
import { f7Button, f7Chip, f7Icon, f7Link } from 'framework7-vue';
import type { AppDetail } from '../types/app-detail.types';

defineProps<{
    app: AppDetail;
}>();

defineEmits<{
    (e: 'edit'): void;
}>();
</script>
<style scoped>
.page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 32px;
    padding-bottom: 24px;
    border-bottom: 1px solid #e2e8f0;
}

.header-left {
    display: flex;
    align-items: center;
    gap: 16px;
    min-width: 0;
}

.header-info {
    min-width: 0;
}

.back-btn {
    color: #64748b;
    flex-shrink: 0;
}

.app-avatar {
    width: 56px;
    height: 56px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 20px;
    font-weight: 600;
    flex-shrink: 0;
}

.title-row {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
}

.header-info h1 {
    font-size: 24px;
    font-weight: 600;
    color: #1e293b;
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 480px;
}

.mode-badge {
    text-transform: uppercase;
    font-size: 10px;
    font-weight: 600;
    height: 20px;
    flex-shrink: 0;
}

.header-info p {
    font-size: 14px;
    color: #64748b;
    margin: 4px 0 0 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 520px;
}

.header-actions {
    display: flex;
    gap: 12px;
    flex-shrink: 0;
}

.edit-btn {
    --f7-button-bg-color: #2563eb;
    --f7-button-hover-bg-color: #1d4ed8;
    height: 36px;
    border-radius: 8px;
    font-weight: 500;
    padding: 0 16px;
}
</style>
