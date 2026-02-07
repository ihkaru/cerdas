<template>
    <div class="device-frame" :class="[`device-${device}`, `orientation-${orientation}`]" :style="frameStyle">
        <!-- Device Notch (for phone) -->
        <div v-if="device === 'phone'" class="device-notch" />

        <!-- Screen Content -->
        <div class="device-screen">
            <slot />
        </div>

        <!-- Home Indicator -->
        <div class="home-indicator" />
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { DEVICE_DIMENSIONS } from '../../types/editor.types';

// ============================================================================
// Props
// ============================================================================

interface Props {
    device?: 'phone' | 'tablet';
    orientation?: 'portrait' | 'landscape';
    scale?: number;
}

const props = withDefaults(defineProps<Props>(), {
    device: 'phone',
    orientation: 'portrait',
    scale: 0.7,
});

// ============================================================================
// Computed
// ============================================================================

const dimensionKey = computed(() => `${props.device}-${props.orientation}`);

const dimensions = computed(() => DEVICE_DIMENSIONS[dimensionKey.value]);

const frameStyle = computed(() => {
    const d = dimensions.value || { width: 375, height: 667, borderRadius: 40 };
    return {
        width: `${d.width * props.scale}px`,
        height: `${d.height * props.scale}px`,
        borderRadius: `${d.borderRadius * props.scale}px`,
    };
});
</script>

<style scoped>
.device-frame {
    position: relative;
    background: #000;
    box-shadow:
        0 0 0 2px #1a1a1a,
        0 0 0 4px #333,
        0 20px 60px rgba(0, 0, 0, 0.5);
    overflow: hidden;
    transition: all 0.3s ease;
}

/* Device Notch */
.device-notch {
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 35%;
    height: 24px;
    background: #000;
    border-radius: 0 0 16px 16px;
    z-index: 10;
}

.orientation-landscape .device-notch {
    display: none;
}

/* Device Screen */
.device-screen {
    width: 100%;
    height: 100%;
    background: #fff;
    overflow: auto;
    border-radius: inherit;
}

/* Add padding for notch area */
.device-phone.orientation-portrait .device-screen {
    padding-top: 32px;
}

/* Home Indicator */
.home-indicator {
    position: absolute;
    bottom: 8px;
    left: 50%;
    transform: translateX(-50%);
    width: 35%;
    height: 4px;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 2px;
    z-index: 10;
}

.device-tablet .home-indicator {
    width: 20%;
}

/* Tablet specific */
.device-tablet {
    box-shadow:
        0 0 0 3px #1a1a1a,
        0 0 0 6px #333,
        0 30px 80px rgba(0, 0, 0, 0.4);
}

.device-tablet .device-notch {
    display: none;
}
</style>
