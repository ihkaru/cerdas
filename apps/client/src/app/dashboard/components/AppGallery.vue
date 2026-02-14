<template>
    <f7-block-title medium>My Apps</f7-block-title>
    <div class="app-grid padding-horizontal padding-bottom">
        <div v-for="app in apps" :key="app.id" @click="handleAppClick(app.id)" class="clickable">
            <f7-card class="no-margin shadow-sm app-card full-height" :class="{ 'bg-color-white': true }">
                <f7-card-content class="padding-vertical">
                    <div class="display-flex flex-direction-column align-items-center">
                        <div class="app-icon-wrapper bg-color-blue-light rounded-circle display-flex justify-content-center align-items-center"
                            style="width: 48px; height: 48px; padding: 10px;">
                            <f7-icon :f7="getAppIcon(app)" size="24" color="blue"></f7-icon>
                        </div>
                        <div class="margin-top text-align-center line-clamp-2 font-weight-bold size-14">{{ app.name }}
                        </div>
                        <div class="margin-top-half text-color-gray size-12 line-clamp-2 text-align-center">{{
                            app.description || 'Data Collection' }}
                        </div>
                    </div>
                </f7-card-content>
            </f7-card>
        </div>

        <div v-if="apps.length === 0" class="col-100 padding text-align-center text-color-gray">
            <f7-icon f7="square_stack_3d_up" size="48" class="opacity-50"></f7-icon>
            <p>No apps installed.<br><small>Sync to download apps.</small></p>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { Table } from '../types';

defineProps<{
    apps: Table[]; // "apps" represents tables/forms here
}>();

const emit = defineEmits<{
    (e: 'open-app', id: string): void;
}>();

const handleAppClick = (id: string) => {
    emit('open-app', id);
};

const getAppIcon = (app: Table) => {
    let settings: Record<string, unknown> = app.settings as Record<string, unknown> || {};
    if (typeof settings === 'string') {
        try {
            settings = JSON.parse(settings);
        } catch {
            settings = {};
        }
    }
    return settings?.icon || 'square_stack_3d_up_fill';
};
</script>

<style scoped>
.app-card {
    transition: transform 0.2s;
}

.app-card:active {
    transform: scale(0.95);
}

.app-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
}
</style>
