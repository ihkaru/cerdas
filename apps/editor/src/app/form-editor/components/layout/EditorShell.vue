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

            <aside class="preview-panel">
                <slot name="preview"></slot>
            </aside>
        </div>

        <!-- Popovers/Modals Slot -->
        <slot name="modals"></slot>
    </f7-page>
</template>

<script setup lang="ts">
// EditorShell: Layout container component
</script>

<style scoped>
.form-editor-page {
    --header-height: 56px;
    --sidebar-width: 180px;
    --preview-width: 420px;
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
}

.editor-main {
    flex: 1;
    display: flex;
    overflow: hidden;
    position: relative;
    background: #f8fafc;
}

.preview-panel {
    width: var(--preview-width);
    background: #1e293b;
    display: flex;
    flex-direction: column;
    border-left: 1px solid #334155;
}
</style>
