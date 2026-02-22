<template>
    <div class="map-wrapper flex-shrink-0" style="height: 60vh; width: 100%; position: relative;">
        <div :id="mapId" class="map-container" style="height: 100%; width: 100%; z-index: 1;"></div>

        <!-- Loading Overlay -->
        <div v-if="mapLoading" class="map-loading-overlay">
            <f7-preloader />
            <span class="text-color-gray size-12 margin-top-half">Memuat peta...</span>
        </div>

        <!-- Processing Overlay (Async Build) -->
        <div v-if="isProcessing && !mapLoading" class="map-loading-overlay">
            <div class="display-flex flex-direction-column align-items-center">
                <f7-preloader />
                <span class="margin-top-half size-12 font-weight-bold">Memproses Peta... {{ processProgress }}%</span>
                <span class="size-10 text-color-gray">Mohon tunggu sebentar</span>
            </div>
        </div>

        <!-- Empty State Overlay -->
        <div v-if="!mapLoading && validLocations.length === 0" class="map-empty-overlay">
            <f7-icon f7="map" size="40" class="text-color-gray margin-bottom"></f7-icon>
            <span class="text-color-gray">Belum ada data lokasi</span>
        </div>

        <!-- Locate Me FAB -->
        <div class="map-fab-container">
            <f7-button fab color="white" class="map-action-btn margin-bottom-half" @click="emit('toggle-style')">
                <f7-icon :f7="currentStyle === 'satellite' ? 'map' : 'globe'" size="22" color="blue"></f7-icon>
            </f7-button>
            <f7-button fab color="white" class="map-action-btn" @click="emit('locate')" :loading="locating">
                <f7-icon f7="location" size="22" color="blue"></f7-icon>
            </f7-button>
        </div>
    </div>
</template>

<script setup lang="ts">
defineProps<{
    mapId: string;
    mapLoading: boolean;
    isProcessing: boolean;
    processProgress: number;
    validLocations: any[];
    currentStyle: 'satellite' | 'streets';
    locating: boolean;
}>();

const emit = defineEmits<{
    (e: 'toggle-style'): void;
    (e: 'locate'): void;
}>();
</script>

<style scoped>
.map-fab-container {
    position: absolute;
    top: 16px;
    right: 16px;
    z-index: 1000;
}

.map-action-btn {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background-color: #ffffff !important;
    border: 1px solid rgba(0, 0, 0, 0.1);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1001;
}

/* Loading & Empty overlays */
.map-loading-overlay,
.map-empty-overlay {
    position: absolute;
    inset: 0;
    z-index: 2;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: rgba(248, 249, 250, 0.9);
    pointer-events: none;
}

/* User location blue dot with pulse */
:global(.user-location-marker) {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #2196F3;
    border: 2px solid #fff;
    box-shadow: 0 0 0 4px rgba(33, 150, 243, 0.3);
    animation: user-pulse 2s ease-out infinite;
}

@keyframes user-pulse {
    0% {
        box-shadow: 0 0 0 4px rgba(33, 150, 243, 0.4);
    }

    70% {
        box-shadow: 0 0 0 12px rgba(33, 150, 243, 0);
    }

    100% {
        box-shadow: 0 0 0 4px rgba(33, 150, 243, 0);
    }
}

/* MapLibre popup styling */
:global(.maplibregl-popup-content) {
    border-radius: 10px;
    padding: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

:global(.map-popup-content) {
    font-family: var(--f7-font-family);
}

:global(.map-popup-content .popup-title) {
    font-weight: 700;
    font-size: 15px;
    margin-bottom: 2px;
    color: #000;
}

:global(.map-popup-content .popup-subtitle) {
    font-size: 12px;
    color: #666;
    line-height: 1.3;
}

/* Force white text/icons for filled buttons in popups */
:global(.map-popup-content .button-fill) {
    --f7-button-text-color: #fff !important;
    color: #fff !important;
}

:global(.map-popup-content .button-fill i),
:global(.map-popup-content .button-fill span) {
    color: #fff !important;
}
</style>
