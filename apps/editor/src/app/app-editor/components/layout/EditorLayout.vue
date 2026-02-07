<template>
    <div class="editor-layout" :class="layoutClass">
        <!-- Mobile: Tabbed Layout -->
        <template v-if="isMobile">
            <f7-toolbar tabbar top>
                <f7-link tab-link="#tab-editor" :tab-link-active="activeTab === 'editor'" @click="activeTab = 'editor'">
                    <f7-icon f7="doc_text" />
                    <span>Editor</span>
                </f7-link>
                <f7-link tab-link="#tab-preview" :tab-link-active="activeTab === 'preview'"
                    @click="activeTab = 'preview'">
                    <f7-icon f7="eye" />
                    <span>Preview</span>
                </f7-link>
            </f7-toolbar>

            <f7-tabs class="editor-tabs">
                <f7-tab id="tab-editor" class="editor-tab" :tab-active="activeTab === 'editor'">
                    <slot name="editor" />
                </f7-tab>
                <f7-tab id="tab-preview" class="preview-tab" :tab-active="activeTab === 'preview'">
                    <slot name="preview" />
                </f7-tab>
            </f7-tabs>
        </template>

        <!-- Desktop: Split Panel Layout -->
        <template v-else>
            <div class="editor-pane" :style="{ width: editorWidth }">
                <slot name="editor" />
            </div>

            <div class="resize-handle" @mousedown="startResize" />

            <div class="preview-pane" :style="{ width: previewWidth }">
                <slot name="preview" />
            </div>
        </template>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';

// ============================================================================
// Props & Emits
// ============================================================================

interface Props {
    /** Breakpoint for mobile view (px) */
    mobileBreakpoint?: number;
    /** Initial split ratio (0-1, editor portion) */
    initialSplit?: number;
    /** Minimum panel width (px) */
    minPanelWidth?: number;
}

const props = withDefaults(defineProps<Props>(), {
    mobileBreakpoint: 768,
    initialSplit: 0.5,
    minPanelWidth: 300,
});

// ============================================================================
// State
// ============================================================================

const windowWidth = ref(window.innerWidth);
const splitRatio = ref(props.initialSplit);
const activeTab = ref<'editor' | 'preview'>('editor');
const isResizing = ref(false);

// ============================================================================
// Computed
// ============================================================================

const isMobile = computed(() => windowWidth.value < props.mobileBreakpoint);

const layoutClass = computed(() => ({
    'mobile-layout': isMobile.value,
    'desktop-layout': !isMobile.value,
    'resizing': isResizing.value,
}));

const editorWidth = computed(() => `${splitRatio.value * 100}%`);
const previewWidth = computed(() => `${(1 - splitRatio.value) * 100}%`);

// ============================================================================
// Resize Handling
// ============================================================================

function handleResize() {
    windowWidth.value = window.innerWidth;
}

function startResize(event: MouseEvent) {
    isResizing.value = true;
    const startX = event.clientX;
    const startRatio = splitRatio.value;
    const containerWidth = (event.target as HTMLElement).parentElement?.clientWidth || window.innerWidth;

    function onMouseMove(e: MouseEvent) {
        const deltaX = e.clientX - startX;
        const deltaRatio = deltaX / containerWidth;
        let newRatio = startRatio + deltaRatio;

        // Clamp to min/max
        const minRatio = props.minPanelWidth / containerWidth;
        const maxRatio = 1 - minRatio;
        newRatio = Math.max(minRatio, Math.min(maxRatio, newRatio));

        splitRatio.value = newRatio;
    }

    function onMouseUp() {
        isResizing.value = false;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
    }

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
}

// ============================================================================
// Lifecycle
// ============================================================================

onMounted(() => {
    window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
    window.removeEventListener('resize', handleResize);
});
</script>

<style scoped>
.editor-layout {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
}

/* Desktop Split Layout */
.desktop-layout {
    flex-direction: row;
}

.editor-pane {
    height: 100%;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    background: var(--f7-page-bg-color);
}

.preview-pane {
    height: 100%;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    background: #1a1a2e;
    align-items: center;
    justify-content: center;
}

.resize-handle {
    width: 6px;
    background: var(--f7-list-border-color);
    cursor: col-resize;
    transition: background 0.2s;
    flex-shrink: 0;
}

.resize-handle:hover,
.resizing .resize-handle {
    background: var(--f7-theme-color);
}

.resizing {
    user-select: none;
}

/* Mobile Tabbed Layout */
.mobile-layout {
    flex-direction: column;
}

.editor-tabs {
    flex: 1;
    overflow: hidden;
}

.editor-tab,
.preview-tab {
    height: 100%;
    overflow: auto;
}

/* Toolbar Styling */
.mobile-layout :deep(.toolbar) {
    background: var(--f7-bars-bg-color);
}

.mobile-layout :deep(.toolbar a) {
    flex-direction: column;
    font-size: 11px;
}

.mobile-layout :deep(.toolbar .icon) {
    font-size: 20px;
    margin-bottom: 2px;
}
</style>
