<template>
    <f7-block-title medium class="apps-title">My Apps</f7-block-title>

    <div class="app-grid padding-horizontal padding-bottom">
        <div v-for="app in apps" :key="app.id" class="app-card" @click="handleAppClick(app.id)">
            <div class="app-icon-wrapper">
                <f7-icon :f7="getAppIcon(app)" size="26" class="app-icon"></f7-icon>
            </div>
            <div class="app-name">{{ app.name }}</div>
            <div class="app-desc">{{ app.description || 'Data Collection' }}</div>
        </div>

        <!-- Empty State -->
        <div v-if="apps.length === 0" class="app-empty">
            <div class="app-empty-icon-wrapper">
                <f7-icon f7="square_stack_3d_up" size="32" class="app-empty-icon"></f7-icon>
            </div>
            <p class="app-empty-title">No Apps Installed</p>
            <p class="app-empty-sub">Sync to download your apps</p>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { Table } from '../types';

defineProps<{
    apps: Table[];
}>();

const emit = defineEmits<{
    (e: 'open-app', id: string): void;
}>();

const handleAppClick = (id: string) => {
    emit('open-app', id);
};

const getAppIcon = (app: Table) => {
    let settings: Record<string, unknown> = (app.settings as Record<string, unknown>) || {};
    if (typeof settings === 'string') {
        try { settings = JSON.parse(settings); } catch { settings = {}; }
    }
    return settings?.icon || 'square_stack_3d_up_fill';
};
</script>

<style scoped>
.apps-title {
    margin-bottom: 12px;
}

/* ── Grid ── */
.app-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
}

/* ── Card ── */
.app-card {
    background: var(--f7-block-bg-color, #fff);
    border-radius: 16px;
    padding: 20px 12px 16px;
    text-align: center;
    border: 1px solid rgba(0, 0, 0, 0.06);
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    transition: transform 0.18s ease, box-shadow 0.18s ease;
    -webkit-tap-highlight-color: transparent;
}

.app-card:active {
    transform: scale(0.95);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

/* ── Icon ── */
.app-icon-wrapper {
    width: 56px;
    height: 56px;
    border-radius: 14px;
    background: rgba(0, 122, 255, 0.1);
    border: 1px solid rgba(0, 122, 255, 0.15);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 4px;
}

.app-icon {
    color: #007AFF;
}

/* ── Text ── */
.app-name {
    font-size: 13px;
    font-weight: 600;
    color: var(--f7-text-color);
    line-height: 1.3;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.app-desc {
    font-size: 11px;
    color: var(--f7-label-color);
    opacity: 0.6;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

/* ── Empty State ── */
.app-empty {
    grid-column: 1 / -1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 40px 16px;
}

.app-empty-icon-wrapper {
    width: 64px;
    height: 64px;
    border-radius: 16px;
    background: rgba(0, 0, 0, 0.04);
    border: 1px solid rgba(0, 0, 0, 0.06);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 8px;
}

.app-empty-icon {
    color: var(--f7-label-color);
    opacity: 0.4;
}

.app-empty-title {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    color: var(--f7-text-color);
    opacity: 0.5;
}

.app-empty-sub {
    margin: 0;
    font-size: 12px;
    color: var(--f7-label-color);
    opacity: 0.4;
}
</style>