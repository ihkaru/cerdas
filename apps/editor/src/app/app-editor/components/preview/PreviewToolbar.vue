<template>
    <div class="preview-toolbar">
        <!-- Device Selector -->
        <f7-segmented strong tag="div" class="device-selector">
            <f7-button :active="device === 'phone'" @click="emit('update:device', 'phone')">
                <f7-icon f7="device_phone_portrait" />
            </f7-button>
            <f7-button :active="device === 'tablet'" @click="emit('update:device', 'tablet')">
                <f7-icon f7="device_ipad" />
            </f7-button>
        </f7-segmented>

        <!-- Orientation Toggle -->
        <f7-button class="orientation-toggle" :class="{ rotated: orientation === 'landscape' }"
            @click="toggleOrientation">
            <f7-icon f7="rotate_right" />
        </f7-button>

        <!-- Scale Slider -->
        <div class="scale-control">
            <f7-icon f7="minus" class="scale-icon" />
            <input type="range" :value="scale" min="0.4" max="1" step="0.1" class="scale-slider"
                @input="emit('update:scale', parseFloat(($event.target as HTMLInputElement).value))" />
            <f7-icon f7="plus" class="scale-icon" />
        </div>

        <!-- Refresh Preview -->
        <f7-button class="refresh-btn" @click="emit('refresh')">
            <f7-icon f7="arrow_clockwise" />
        </f7-button>
    </div>
</template>

<script setup lang="ts">
// ============================================================================
// Props & Emits
// ============================================================================

interface Props {
    device: 'phone' | 'tablet';
    orientation: 'portrait' | 'landscape';
    scale: number;
}

const props = defineProps<Props>();

const emit = defineEmits<{
    'update:device': [device: 'phone' | 'tablet'];
    'update:orientation': [orientation: 'portrait' | 'landscape'];
    'update:scale': [scale: number];
    refresh: [];
}>();

// ============================================================================
// Handlers
// ============================================================================

function toggleOrientation() {
    emit(
        'update:orientation',
        props.orientation === 'portrait' ? 'landscape' : 'portrait'
    );
}
</script>

<style scoped>
.preview-toolbar {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    padding: 12px 16px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    margin-bottom: 16px;
}

/* Device Selector */
.device-selector {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 8px;
}

.device-selector :deep(.button) {
    color: rgba(255, 255, 255, 0.6);
    min-width: 44px;
}

.device-selector :deep(.button-active) {
    color: #fff;
    background: var(--f7-theme-color);
}

.device-selector :deep(.icon) {
    font-size: 20px;
}

/* Orientation Toggle */
.orientation-toggle {
    color: rgba(255, 255, 255, 0.6);
    width: 40px;
    height: 40px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.1);
    transition: transform 0.3s ease;
}

.orientation-toggle:hover {
    background: rgba(255, 255, 255, 0.15);
}

.orientation-toggle.rotated {
    transform: rotate(90deg);
}

.orientation-toggle :deep(.icon) {
    font-size: 20px;
}

/* Scale Control */
.scale-control {
    display: flex;
    align-items: center;
    gap: 8px;
}

.scale-icon {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.4);
}

.scale-slider {
    width: 80px;
    height: 4px;
    border-radius: 2px;
    background: rgba(255, 255, 255, 0.2);
    appearance: none;
    cursor: pointer;
}

.scale-slider::-webkit-slider-thumb {
    appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--f7-theme-color);
    cursor: pointer;
}

/* Refresh Button */
.refresh-btn {
    color: rgba(255, 255, 255, 0.6);
    width: 40px;
    height: 40px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.1);
}

.refresh-btn:hover {
    background: rgba(255, 255, 255, 0.15);
}

.refresh-btn :deep(.icon) {
    font-size: 18px;
}
</style>
