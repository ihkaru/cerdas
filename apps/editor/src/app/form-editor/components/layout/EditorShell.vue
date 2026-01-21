<template>
    <f7-page name="editor-shell" class="form-editor-page" :page-content="false">
        <slot name="header"></slot>

        <div class="editor-layout">
            <aside class="editor-sidebar">
                <slot name="sidebar"></slot>
            </aside>

            <main class="editor-main">
                <slot name="main"></slot>
            </main>

            <!-- Resizable Divider for Preview Panel -->
            <ResizableDivider class="preview-divider" @resize-start="previewBaseWidth = previewWidth"
                @resize="(delta) => previewWidth = Math.max(320, Math.min(600, previewBaseWidth - delta))" />

            <aside class="preview-panel" :style="{ width: previewWidth + 'px' }">
                <slot name="preview"></slot>
            </aside>
        </div>

        <!-- Popovers/Modals Slot -->
        <slot name="modals"></slot>
    </f7-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import ResizableDivider from '../shared/ResizableDivider.vue';

// Preview panel width state
const previewWidth = ref(420);
const previewBaseWidth = ref(420);
</script>

<style scoped>
.form-editor-page {
    --header-height: 56px;
    --sidebar-width: 180px;
    background: #f8fafc;
}

.form-editor-page :deep(.navbar) {
    display: none !important;
}

.editor-layout {
    display: flex;
    position: fixed;
    top: var(--header-height);
    left: 0;
    right: 0;
    bottom: 0;
}

.editor-sidebar {
    width: var(--sidebar-width);
    background: white;
    border-right: 1px solid #e2e8f0;
    padding: 16px 8px;
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
}

.editor-main {
    flex: 1;
    display: flex;
    overflow: hidden;
    position: relative;
    background: #f8fafc;
}

.preview-divider {
    background: #f1f5f9;
    /* Light gray background to separate Main from Preview */
    border-left: 1px solid #e2e8f0;
    border-right: 1px solid #334155;
    /* Dark border on right to match preview */
}

.preview-divider:hover,
.preview-divider.dragging {
    background: #e2e8f0;
}

.preview-divider :deep(.divider-handle) {
    background: #cbd5e1;
    /* Visible gray handle */
}

.preview-divider:hover :deep(.divider-handle),
.preview-divider.dragging :deep(.divider-handle) {
    background: #3b82f6;
    /* Blue on hover */
}

.preview-divider :deep(.handle-dots span) {
    background: #64748b;
}

.preview-panel {
    min-width: 320px;
    max-width: 800px;
    /* Increased max width */
    background: #1e293b;
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
}
</style>
