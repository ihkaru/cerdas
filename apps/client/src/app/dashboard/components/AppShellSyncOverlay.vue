<template>
    <f7-popup :opened="visible" :close-on-backdrop-click="false" class="sync-popup" :backdrop="true">
        <f7-page-content class="sync-content">
            <div class="sync-card">
                <!-- Cloud Icon Animation -->
                <div class="sync-icon-wrapper">
                    <f7-icon f7="cloud_upload_fill" size="80" class="text-color-primary sync-pulse"></f7-icon>
                    <div class="sync-ripple"></div>
                </div>

                <h2 class="sync-title">Syncing Data...</h2>
                <p class="sync-message">{{ message }}</p>

                <!-- Progress Bar -->
                <div class="progress-container">
                    <div class="progress-track">
                        <div class="progress-fill" :style="{ width: progress + '%' }"></div>
                    </div>
                    <div class="progress-labels">
                        <span>Progress</span>
                        <span>{{ Math.round(progress) }}%</span>
                    </div>
                </div>

                <!-- Info Text -->
                <p class="sync-info">
                    <f7-icon f7="info_circle_fill" size="14" class="sync-info-icon"></f7-icon>
                    Please do not close the app
                </p>
            </div>
        </f7-page-content>
    </f7-popup>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
    visible: boolean;
    progress: number;
    message: string;
}>();

const progress = computed(() => Math.min(Math.max(props.progress, 0), 100));
</script>

<style scoped>
:deep(.sync-popup) {
    --f7-popup-tablet-width: 630px;
    --f7-popup-tablet-height: 630px;
    backdrop-filter: blur(10px);
    background: rgba(var(--f7-page-bg-color-rgb), 0.95);
}

/* Layout */
.sync-content {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 100%;
}

.sync-card {
    width: 80%;
    max-width: 400px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
}

/* Icon */
.sync-icon-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 120px;
    height: 120px;
    overflow: hidden;
}

.sync-pulse {
    animation: floating-pulse 3s ease-in-out infinite;
    position: relative;
    z-index: 2;
    filter: drop-shadow(0 4px 12px rgba(var(--f7-theme-color-rgb), 0.3));
}

.sync-ripple {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: rgba(var(--f7-theme-color-rgb), 0.1);
    animation: ripple 2s cubic-bezier(0, 0.2, 0.8, 1) infinite;
    z-index: 1;
}

/* Typography */
.sync-title {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
    color: var(--f7-text-color);
    text-align: center;
}

.sync-message {
    margin: 0;
    font-size: 14px;
    color: var(--f7-label-color);
    text-align: center;
    line-height: 1.5;
}

/* Progress Bar */
.progress-container {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.progress-track {
    width: 100%;
    height: 8px;
    background: rgba(var(--f7-theme-color-rgb), 0.12);
    border-radius: 99px;
    overflow: hidden;
}

.progress-fill {
    height: 100%;
    background: var(--f7-theme-color);
    border-radius: 99px;
    transition: width 0.3s ease;
}

.progress-labels {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    font-weight: 600;
    color: var(--f7-label-color);
}

/* Info */
.sync-info {
    margin: 4px 0 0;
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 12px;
    color: var(--f7-label-color);
    opacity: 0.7;
    text-align: center;
}

.sync-info-icon {
    flex-shrink: 0;
}

/* Animations */
@keyframes floating-pulse {

    0%,
    100% {
        transform: translateY(0) scale(1);
        filter: drop-shadow(0 4px 12px rgba(var(--f7-theme-color-rgb), 0.3));
    }

    50% {
        transform: translateY(-5px) scale(1.05);
        filter: drop-shadow(0 8px 16px rgba(var(--f7-theme-color-rgb), 0.4));
    }
}

@keyframes ripple {
    0% {
        width: 0;
        height: 0;
        opacity: 0.8;
    }

    100% {
        width: 140px;
        height: 140px;
        opacity: 0;
    }
}
</style>