<template>
    <div class="preview-panel-container">
        <div class="preview-header">
            <div class="device-toggles">
                <button class="toggle-btn" :class="{ active: device === 'phone' }" @click="device = 'phone'"
                    title="Phone View">
                    <f7-icon f7="device_phone_portrait" />
                </button>
                <button class="toggle-btn" :class="{ active: device === 'tablet' }" @click="device = 'tablet'"
                    title="Tablet View">
                    <f7-icon f7="device_tablet_portrait" />
                </button>
            </div>

            <div class="role-selector">
                <f7-icon f7="person_crop_circle" size="16" />
                <select v-model="role">
                    <option value="admin">Admin (Me)</option>
                    <option value="supervisor">Supervisor</option>
                    <option value="enumerator">Enumerator</option>
                </select>
            </div>

            <div class="preview-actions">
                <button class="action-btn" @click="refresh" title="Refresh Preview">
                    <f7-icon f7="arrow_clockwise" />
                </button>
            </div>
        </div>

        <div class="preview-content">
            <DeviceFrame :device="device" :orientation="orientation" :scale="scale">
                <LivePreview :key="refreshKey" :role="role" :app-views="appViews" :views-version="viewsVersion" />
            </DeviceFrame>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import DeviceFrame from '../preview/DeviceFrame.vue';
import LivePreview from '../preview/LivePreview.vue';

const props = defineProps<{
    appViews?: Record<string, any>;
    viewsVersion?: number;
}>();

const device = ref<'phone' | 'tablet'>('phone');
const orientation = ref<'portrait' | 'landscape'>('portrait');
const role = ref('admin');
const scale = ref(1.0);
const refreshKey = ref(0);

function refresh() {
    refreshKey.value++;
}
</script>

<style scoped>
.preview-panel-container {
    height: 100%;
    display: flex;
    flex-direction: column;
}

.preview-header {
    height: 48px;
    border-bottom: 1px solid #334155;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 16px;
    background: #1e293b;
    gap: 16px;
}

.role-selector {
    display: flex;
    align-items: center;
    gap: 8px;
    background: #0f172a;
    padding: 4px 12px;
    border-radius: 6px;
    height: 32px;
    color: #94a3b8;
}

.role-selector select {
    background: transparent;
    border: none;
    color: #e2e8f0;
    font-size: 13px;
    outline: none;
    cursor: pointer;
}

.role-selector select option {
    background: #1e293b;
    color: #e2e8f0;
}

.device-toggles {
    display: flex;
    background: #0f172a;
    border-radius: 6px;
    padding: 2px;
}

.toggle-btn {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: transparent;
    color: #64748b;
    border-radius: 4px;
    cursor: pointer;
}

.toggle-btn:hover {
    color: #94a3b8;
}

.toggle-btn.active {
    background: #334155;
    color: #f8fafc;
}

.toggle-btn :deep(.icon) {
    font-size: 18px;
}

.action-btn {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: transparent;
    color: #64748b;
    border-radius: 4px;
    cursor: pointer;
}

.action-btn:hover {
    background: rgba(255, 255, 255, 0.05);
    color: #f8fafc;
}

.preview-content {
    flex: 1;
    overflow: hidden;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #1e293b;
    padding: 20px;
}
</style>
