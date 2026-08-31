<template>
    <EditorShell>
        <template #header>
            <EditorHeader :title="tableName" :app-name="appStore.currentApp?.name" :is-dirty="isGlobalDirty"
                :is-published="isPublished" :version="currentVersion" :can-publish="!isPublished"
                @rename="handleRename" @save="handleSave" @publish="onPublish" @back="() => handleBack(isGlobalDirty)"
                @export="exportTable" />
        </template>

        <template #sidebar>
            <EditorSidebar v-model="activeTab" :has-form-selected="hasTableSelected" />
        </template>

        <template #main>
            <EditorTabContent ref="editorTabContentRef" v-model:activeTab="activeTab" :panels="panels" :table-editor="tableEditor"
                :nav-management="navManagement" :table-selection="tableSelection"
                :app-view-management="appViewManagement" @reset-field="handleFieldReset"
                @code-apply="handleCodeApply" />
        </template>

        <template #preview>
            <EditorPreviewPanel 
                :app-views="appViews" 
                :views-version="viewsVersion"
                :selected-view-id="selectedViewKey"
                :navigation="navigation"
                :is-dirty="isGlobalDirty"
            />
        </template>

        <template #modals>
            <NewSourceModal v-model:opened="showNewSourceModal"
                @select="tableSelection.handleSourceSelect" />
            <ExcelImportModal v-if="appStore.currentApp" v-model:opened="showExcelImportModal"
                :app-id="appStore.currentApp.id" :initial-source-type="importSourceType" @imported="tableSelection.handleExcelImported" />
            <PublishDialog :visible="showPublishDialog" @confirm="onPublishConfirm"
                @cancel="showPublishDialog = false" />
        </template>
    </EditorShell>
</template>

<script setup lang="ts">
import { useAppStore, useTableStore } from '@/stores';
import { f7 } from 'framework7-vue';
import { computed, ref, provide } from 'vue';

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
import { useAppViewManagement } from './composables/useAppViewManagement';
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
const { activeTab, showNewSourceModal, showExcelImportModal, importSourceType } = panels;
provide('activeTab', activeTab);
const highlightedViewOption = ref<string>('');
provide('highlightedViewOption', highlightedViewOption);

// Ref to EditorTabContent for programmatic sub-tab switching
const editorTabContentRef = ref<InstanceType<typeof EditorTabContent> | null>(null);

// 2. Core Editor Logic
const tableEditor = useTableEditor();
const { tableName, selectedFieldPath, isDirty, selectedOriginalField, updateField, loadTable } = tableEditor;

// 3. Navigation Management
const navManagement = useNavigationManagement(() => appStore.currentApp?.id ? String(appStore.currentApp.id) : null);
const { navigation, selectedNavKey, isNavDirty, fetchNavigation } = navManagement;
provide('selectedNavKey', selectedNavKey);

// 3b. App View Management (App-level views stored in apps.view_configs)
const appViewManagement = useAppViewManagement(() => appStore.currentApp?.id ? String(appStore.currentApp.id) : null);
const { appViews, viewsVersion, selectedViewKey, isViewsDirty, fetchAppViews } = appViewManagement;
provide('selectedViewKey', selectedViewKey);

// 4. Table Selection & CRUD
const tableSelection = useTableSelection(
    appStore,
    tableStore,
    {
        onTableLoaded: (...args) => loadTable(...args),
        showNewSourceModal,
        showExcelImportModal,
        importSourceType,
        isGlobalDirty: () => isGlobalDirty.value,
        handleSave: () => handleSave(),
        onImportSuccess: (_tableId: string) => {
            // Switch to Data Preview sub-tab so creator sees their data immediately
            editorTabContentRef.value?.switchToDataPreview?.();
            // Guidance toast
            f7.toast.show({
                text: '✓ Data berhasil diimport! Lihat data di tab <b>Data Preview</b> di samping, lalu buka <b>Views</b> untuk mengatur tampilan.',
                position: 'bottom',
                closeTimeout: 5000,
                closeButton: true,
            });
        }
    }
);
const { hasTableSelected, selectTable, currentVersion, isPublished } = tableSelection;

// 6. UI Helpers
const isGlobalDirty = computed(() => isDirty.value || isNavDirty.value || isViewsDirty.value);

// 5. Handlers
const handlers = useEditorHandlers(props, { tableStore, navManagement, tableEditor, tableSelection, appViewManagement, isGlobalDirty });
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
import { onMounted, onUnmounted } from 'vue';

const onBeforeUnload = (e: BeforeUnloadEvent) => {
    if (isGlobalDirty.value) {
        e.preventDefault();
        e.returnValue = ''; // Required for most browsers
    }
};

onMounted(() => {
    window.addEventListener('beforeunload', onBeforeUnload);
});

onUnmounted(() => {
    window.removeEventListener('beforeunload', onBeforeUnload);
});

useEditorLifecycle(props, {
    appStore,
    tableStore,
    onTableLoaded: loadTable,
    fetchNavigation,
    fetchAppViews,
    initNewTable: tableEditor.initNewTable,
    setActiveTab: (tab: string) => panels.activeTab.value = tab,
    selectTable,
    currentVersion,
    isPublished
});
</script>
