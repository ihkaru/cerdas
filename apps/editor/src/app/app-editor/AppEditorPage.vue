<template>
    <EditorShell>
        <template #header>
            <EditorHeader :title="tableName" :app-name="appStore.currentApp?.name" :is-dirty="isGlobalDirty"
                :is-published="isPublished" :version="currentVersion" :can-publish="isGlobalDirty && hasTableSelected"
                @rename="handleRename" @save="handleSave" @publish="onPublish" @back="handleBack"
                @export="exportTable" />
        </template>

        <template #sidebar>
            <EditorSidebar v-model="panels.activeTab.value" :has-form-selected="hasTableSelected" />
        </template>

        <template #main>
            <EditorTabContent v-model:activeTab="panels.activeTab.value" :panels="panels" :table-editor="tableEditor"
                :nav-management="navManagement" :table-selection="tableSelection" @reset-field="handleFieldReset"
                @code-apply="handleCodeApply" />
        </template>

        <template #preview>
            <EditorPreviewPanel />
        </template>

        <template #modals>
            <NewSourceModal v-model:opened="panels.showNewSourceModal.value"
                @select="tableSelection.handleSourceSelect" />
            <ExcelImportModal v-if="appStore.currentApp" v-model:opened="panels.showExcelImportModal.value"
                :app-id="appStore.currentApp.id" @imported="tableSelection.handleExcelImported" />
            <PublishDialog :visible="showPublishDialog" @confirm="onPublishConfirm"
                @cancel="showPublishDialog = false" />
        </template>
    </EditorShell>
</template>

<script setup lang="ts">
import { useAppStore, useTableStore } from '@/stores';
import { f7 } from 'framework7-vue';
import { computed, ref } from 'vue';

// Styles
import './styles/app-editor.css';

// Layout Components
import EditorHeader from './components/layout/EditorHeader.vue';
import EditorPreviewPanel from './components/layout/EditorPreviewPanel.vue';
import EditorShell from './components/layout/EditorShell.vue';
import EditorSidebar from './components/layout/EditorSidebar.vue';
import EditorTabContent from './components/layout/EditorTabContent.vue';

// Data Source Modals
import ExcelImportModal from './components/data/ExcelImportModal.vue';
import NewSourceModal from './components/data/NewSourceModal.vue';
import PublishDialog from './components/PublishDialog.vue';

// Composables & Types
import type { F7PageProps } from '@/types/framework7.types';
import { useEditorHandlers } from './composables/useEditorHandlers';
import { useEditorLifecycle } from './composables/useEditorLifecycle';
import { useEditorPanels } from './composables/useEditorPanels';
import { useNavigationManagement } from './composables/useNavigationManagement';
import { useTableEditor } from './composables/useTableEditor';
import { useTableSelection } from './composables/useTableSelection';

const props = defineProps<F7PageProps>();

const appStore = useAppStore();
const tableStore = useTableStore();

// 1. Panels & UI State
const panels = useEditorPanels();

// 2. Core Editor Logic
const tableEditor = useTableEditor();
const { tableName, selectedFieldPath, isDirty, selectedOriginalField, updateField, loadTable } = tableEditor;

// 3. Navigation Management
const navManagement = useNavigationManagement(() => appStore.currentApp?.id ? String(appStore.currentApp.id) : null);
const { isNavDirty, fetchNavigation } = navManagement;

// 4. Table Selection & CRUD
const tableSelection = useTableSelection(
    appStore,
    tableStore,
    {
        onTableLoaded: (...args) => loadTable(...args),
        showNewSourceModal: panels.showNewSourceModal,
        showExcelImportModal: panels.showExcelImportModal
    }
);
const { hasTableSelected, selectTable, currentVersion, isPublished } = tableSelection;

// 5. Handlers
const handlers = useEditorHandlers(props, { tableStore, navManagement, tableEditor, tableSelection });
const { handleSave, handlePublish, confirmPublish, handleRename, handleBack, exportTable, handleCodeApply } = handlers;

// Publish Dialog State
const showPublishDialog = ref(false);
async function onPublish() {
    const result = await handlePublish();
    if (result?.action === 'show-publish-dialog') {
        showPublishDialog.value = true;
    }
}
async function onPublishConfirm(payload: { changelog: string; versionPolicy: string }) {
    showPublishDialog.value = false;
    await confirmPublish(payload);
}

// 6. UI Helpers
const isGlobalDirty = computed(() => isDirty.value || isNavDirty.value);

function handleFieldReset() {
    if (selectedFieldPath.value && selectedOriginalField.value) {
        updateField(selectedFieldPath.value, JSON.parse(JSON.stringify(selectedOriginalField.value)));
        f7.toast.show({
            text: 'Field reset to original',
            position: 'center',
            closeTimeout: 1000,
            icon: '<i class="f7-icons">arrow_uturn_left</i>'
        });
    }
}

// 7. Lifecycle
useEditorLifecycle(props, {
    appStore,
    tableStore,
    onTableLoaded: loadTable,
    fetchNavigation,
    initNewTable: tableEditor.initNewTable,
    setActiveTab: (tab: string) => panels.activeTab.value = tab,
    selectTable,
    currentVersion,
    isPublished
});
</script>
