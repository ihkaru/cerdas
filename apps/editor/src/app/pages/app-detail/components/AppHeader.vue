<template>
    <div class="page-header">
        <div class="header-left">
            <f7-link back icon-f7="chevron_left" class="back-btn" />
            <div class="app-avatar" :style="{ background: app.color }">
                {{ app.name.substring(0, 2).toUpperCase() }}
            </div>
            <div class="header-info">
                <h1>{{ app.name }}</h1>
                <p>{{ app.description || 'No description' }}</p>
            </div>
        </div>
        <div class="header-actions">
            <f7-button outline class="settings-btn">
                <f7-icon f7="gear" />
                Settings
            </f7-button>
            <f7-button fill @click="$emit('create')" class="create-btn">
                <f7-icon f7="plus" />
                New Form
            </f7-button>
        </div>
    </div>
</template>
<script setup lang="ts">
import { f7Button, f7Icon, f7Link } from 'framework7-vue';
import type { AppDetail } from '../types/app-detail.types';

defineProps<{
    app: AppDetail;
}>();

defineEmits<{
    (e: 'create'): void;
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
}

.back-btn {
    color: #64748b;
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
}

.header-info h1 {
    font-size: 24px;
    font-weight: 600;
    color: #1e293b;
    margin: 0;
}

.header-info p {
    font-size: 14px;
    color: #64748b;
    margin: 4px 0 0 0;
}

.header-actions {
    display: flex;
    gap: 12px;
}

.settings-btn {
    --f7-button-border-color: #e2e8f0;
    color: #64748b;
}

.create-btn {
    --f7-button-bg-color: #2563eb;
    --f7-button-hover-bg-color: #1d4ed8;
    border-radius: 8px;
    font-weight: 500;
}
</style>
