<template>
    <EditorShell>
        <template #header>
            <EditorHeader :title="tableName" :is-dirty="isDirty" :is-published="isPublished" :version="currentVersion"
                :can-publish="isDirty && hasTableSelected" @rename="handleRename" @save="handleSave"
                @publish="handlePublish" @back="handleBack" @export="exportTable" />
        </template>

        <template #sidebar>
            <EditorSidebar v-model="activeTab" :has-form-selected="hasTableSelected" />
        </template>

        <template #main>
            <!-- Data Tab (Tables List) -->
            <div v-show="activeTab === 'data'" class="tab-content">
                <div class="field-list-panel"
                    :style="{ width: dataListWidth + 'px', minWidth: '250px', maxWidth: '500px' }">
                    <div class="panel-header">
                        <span class="panel-title">Data Sources</span>
                        <f7-button small fill round @click="createNewTable">
                            <f7-icon f7="plus" size="14" /> New
                        </f7-button>
                    </div>
                    <div class="field-list-scroll">
                        <div v-if="loadingTables" class="start-message">Loading...</div>
                        <div v-else-if="!appTables.length" class="start-message">
                            No tables found. Create one to start.
                        </div>
                        <div v-else class="form-list">
                            <div v-for="table in appTables" :key="table.id" class="form-item"
                                :class="{ 'active': currentTableId === table.id }" @click="selectTable(table.id)">
                                <div class="form-icon-wrapper">
                                    <f7-icon f7="doc_text_fill" size="18" />
                                </div>
                                <div class="form-details">
                                    <div class="form-title">{{ table.name }}</div>
                                    <div class="form-desc">{{ table.description || 'No description' }}</div>
                                </div>
                                <div v-if="currentTableId === table.id" class="active-check">
                                    <f7-icon f7="checkmark_circle_fill" size="16" />
                                </div>
                                <div class="form-actions" @click.stop="handleDeleteTable(table)">
                                    <f7-icon f7="trash" size="16" class="text-color-gray" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <ResizableDivider @resize-start="dataListBaseWidth = dataListWidth"
                    @resize="(delta) => dataListWidth = Math.max(250, Math.min(500, dataListBaseWidth + delta))" />

                <!-- Preview or Detail of selected table -->
                <div class="field-config-panel empty-selection-placeholder">
                    Select a data source to edit its fields
                </div>
            </div>

            <!-- Tab Contents -->
            <div v-show="activeTab === 'fields'" class="tab-content fields-content">
                <!-- Empty state when no table selected -->
                <EditorEmptyState v-if="!hasTableSelected" icon="doc_text" title="No Data Source Selected"
                    action-label="Go to Data Sources" @action="activeTab = 'data'">
                    Select a data source from the <strong>Data</strong> tab to edit its fields.
                </EditorEmptyState>
                <!-- Normal content when table is selected -->
                <template v-else>
                    <div class="field-list-panel"
                        :style="{ width: fieldListWidth + 'px', minWidth: '250px', maxWidth: '600px' }">
                        <div class="field-list-scroll">
                            <FieldList :fields="currentFields" :breadcrumbs="breadcrumbs"
                                :selected-path="selectedFieldPath" @select="selectField" @add="handleNestedAddField"
                                @delete="removeField" @duplicate="duplicateField" @reorder="reorderFieldsAtCurrentLevel"
                                @drill-in="drillInto" @drill-up="drillUp" @drill-to="drillToPath" />
                        </div>
                    </div>
                    <ResizableDivider v-if="showConfigPanel" @resize-start="fieldListBaseWidth = fieldListWidth"
                        @resize="(delta) => fieldListWidth = Math.max(250, Math.min(600, fieldListBaseWidth + delta))" />
                    <div v-if="showConfigPanel" class="field-config-panel">
                        <FieldConfigPanel :field="selectedField" @close="clearSelection" @update="handleFieldUpdate" />
                    </div>
                </template>
            </div>

            <!-- Settings Tab -->
            <div v-show="activeTab === 'settings'" class="tab-content">
                <div class="settings-scroll">
                    <AppSettingsPanel :settings="editorState.settings" @update="updateSettings" />
                </div>
            </div>

            <!-- Views Tab -->
            <div v-show="activeTab === 'views'" class="tab-content">
                <!-- Empty state when no table selected -->
                <EditorEmptyState v-if="!hasTableSelected" icon="rectangle_3_offgrid" title="No Data Source Selected"
                    action-label="Go to Data Sources" @action="activeTab = 'data'">
                    Select a data source from the <strong>Data</strong> tab to configure views.
                </EditorEmptyState>
                <ViewsPanel v-else />
            </div>

            <!-- Actions Tab -->
            <div v-show="activeTab === 'actions'" class="tab-content">
                <EditorEmptyState v-if="!hasTableSelected" icon="bolt" title="No Data Source Selected"
                    action-label="Go to Data Sources" @action="activeTab = 'data'">
                    Select a data source from the <strong>Data</strong> tab to configure actions.
                </EditorEmptyState>
                <ActionsPanel v-else />
            </div>

            <!-- Assignments Tab -->
            <div v-show="activeTab === 'assignments'" class="tab-content">
                <EditorEmptyState v-if="!hasTableSelected" icon="person_2" title="No Data Source Selected"
                    action-label="Go to Data Sources" @action="activeTab = 'data'">
                    Select a data source from the <strong>Data</strong> tab to manage assignments.
                </EditorEmptyState>
                <AssignmentsPanel v-else />
            </div>

            <!-- Code Tab -->
            <div v-show="activeTab === 'code'" class="tab-content code-content">
                <EditorEmptyState v-if="!hasTableSelected" icon="chevron_left_slash_chevron_right"
                    title="No Data Source Selected" action-label="Go to Data Sources" @action="activeTab = 'data'">
                    Select a data source from the <strong>Data</strong> tab to edit its JSON.
                </EditorEmptyState>
                <template v-else>
                    <div class="code-editor-panel"
                        :style="{ width: codeEditorWidth + 'px', minWidth: '400px', maxWidth: '1000px' }">
                        <CodeEditorTab :table-id="currentTableId" :table-name="tableName"
                            :fields="tableForPreview.fields" :layout="editorState.layout"
                            :settings="editorState.settings" @apply="handleCodeApply" />
                    </div>
                    <ResizableDivider @resize-start="codeEditorBaseWidth = codeEditorWidth"
                        @resize="(delta) => codeEditorWidth = Math.max(400, Math.min(1000, codeEditorBaseWidth + delta))" />
                    <div class="code-preview-placeholder">
                        <f7-icon f7="doc_text" size="48" />
                        <p>JSON Preview Area</p>
                        <small>Drag the divider to resize the editor</small>
                    </div>
                </template>
            </div>
        </template>

        <template #preview>
            <EditorPreviewPanel />
        </template>

        <template #modals>
            <NewSourceModal v-model:opened="showNewSourceModal" @select="handleSourceSelect" />
            <ExcelImportModal v-if="appStore.currentApp" v-model:opened="showExcelImportModal"
                :app-id="appStore.currentApp.id" @imported="handleExcelImported" />
        </template>
    </EditorShell>
</template>

<script setup lang="ts">
import { useAppStore, useTableStore } from '@/stores';
import { f7, f7ready } from 'framework7-vue';
import { computed, onMounted, ref } from 'vue';

// Styles (extracted for maintainability)
import './styles/app-editor.css';

// Layout Components
import EditorHeader from './components/layout/EditorHeader.vue';
import EditorPreviewPanel from './components/layout/EditorPreviewPanel.vue';
import EditorShell from './components/layout/EditorShell.vue';
import EditorSidebar from './components/layout/EditorSidebar.vue';

// Field Components
import FieldConfigPanel from './components/field-config/FieldConfigPanel.vue';
import FieldList from './components/field-list/FieldList.vue';

// Tab Components
import ActionsPanel from './components/actions/ActionsPanel.vue';
import AssignmentsPanel from './components/assignments/AssignmentsPanel.vue';
import CodeEditorTab from './components/code/CodeEditorTab.vue';
import AppSettingsPanel from './components/settings/AppSettingsPanel.vue';
import ViewsPanel from './components/views/ViewsPanel.vue';

// Shared Components
import EditorEmptyState from './components/shared/EditorEmptyState.vue';
import ResizableDivider from './components/shared/ResizableDivider.vue';

// Data Source Modals
import ExcelImportModal from './components/data/ExcelImportModal.vue';
import NewSourceModal from './components/data/NewSourceModal.vue';

// Composables & Types
import type { F7PageProps } from '@/types/framework7.types';
import { useTableEditor } from './composables/useTableEditor';
import type { EditableFieldDefinition, LayoutConfig, TableSettings } from './types/editor.types';

const props = defineProps<F7PageProps>();

const tableStore = useTableStore();

// ============================================================================
// State from Composable
// ============================================================================

const {
    tableName,
    selectedFieldPath,
    isDirty,
    selectedField,
    tableForPreview,
    state: editorState,
    currentFields,
    breadcrumbs,
    initNewTable,
    loadTable,
    updateTableName,
    updateField,
    removeField,
    duplicateField,
    selectField,
    clearSelection,
    drillInto,
    drillUp,
    drillToPath,
    addFieldAtCurrentLevel,
    reorderFieldsAtCurrentLevel,
    updateSettings,
    replaceAllFields,
    replaceLayout,
    replaceSettings
} = useTableEditor();

// ============================================================================
// Local State
// ============================================================================

const activeTab = ref('fields');
const isPublished = ref(false);
const currentVersion = ref<number | undefined>(undefined);
const appStore = useAppStore();
const currentTableId = computed(() => editorState.tableId);

// App Tables Logic
const appTables = computed(() => appStore.currentApp?.tables || []);
const loadingTables = computed(() => appStore.loading);

// Check if a table is currently selected (for disabling tabs)
const hasTableSelected = computed(() => !!editorState.tableId && editorState.tableId !== '');

// Panel Widths (for resizable panels)
const fieldListWidth = ref(350);
const fieldListBaseWidth = ref(350);
const dataListWidth = ref(300);
const dataListBaseWidth = ref(300);

// Code Editor panel width
const codeEditorWidth = ref(600);
const codeEditorBaseWidth = ref(600);

// Modals
const showNewSourceModal = ref(false);
const showExcelImportModal = ref(false);

async function selectTable(id: string | number) {
    if (id === currentTableId.value) return;

    f7.preloader.show();
    try {
        await tableStore.fetchTable(id);
        const table = tableStore.currentTable;

        // Find latest version (assuming backend returns versions ordered desc)
        // If not ordered, we should sort, but TableController::show loads them.
        // Actually TableController::show does "load(['versions'])", default order might be ASC by ID.
        // Let's rely on TableController::listVersions behavior or sort here?
        // Safest: Use tableStore.currentTable which should have versions.

        let versionToLoad = null;

        if (table?.versions && table.versions.length > 0) {
            // Sort desc by version number to be safe
            const sortedVersions = [...table.versions].sort((a, b) => b.version - a.version);
            versionToLoad = sortedVersions[0];
        }

        // If no version found (shouldn't happen for valid table), create one?
        // But TableController::store creates v1 draft.

        if (!versionToLoad) {
            // Fallback if no versions exist (rare edge case)
            const draft = await tableStore.createDraft(id);
            versionToLoad = draft;
        }

        // Check if latest is published
        if (versionToLoad.published_at) {
            isPublished.value = true;
            // DO NOT create draft here. Just load the published version.
            // User must explicitly click "Edit" or "Create Draft" (to be implemented if needed)
            // For now, loading it as currentVersion.

            // The existing loadTable expects a "draft" object structure which matches TableVersion
            loadTable(
                String(table!.id),
                table!.name || 'Untitled',
                versionToLoad.fields || [],
                table!.description,
                versionToLoad.layout?.settings,
                versionToLoad.layout,
                String(table!.app_id || '')
            );
            currentVersion.value = versionToLoad.version;
            tableStore.currentVersion = versionToLoad; // Set store version for publish

        } else {
            // It's a draft, use it
            isPublished.value = false;
            loadTable(
                String(table!.id),
                table!.name || 'Untitled',
                versionToLoad.fields || [],
                table!.description,
                versionToLoad.layout?.settings,
                versionToLoad.layout,
                String(table!.app_id || '')
            );
            currentVersion.value = versionToLoad.version;
            tableStore.currentVersion = versionToLoad; // Set store version for publish
        }

    } catch (e: any) {
        f7.dialog.alert(e.message);
    } finally {
        f7.preloader.hide();
    }
}

function createNewTable() {
    showNewSourceModal.value = true;
}

function handleSourceSelect(type: 'blank' | 'excel') {
    if (type === 'blank') {
        createBlankTable();
    } else if (type === 'excel') {
        showExcelImportModal.value = true;
    }
}

function createBlankTable() {
    f7.dialog.prompt('New Table Name', async (name) => {
        if (!name) return;
        f7.preloader.show();
        try {
            if (!appStore.currentApp?.id) throw new Error('No app context');
            const newTable = await tableStore.createTable(appStore.currentApp.id, { name });
            await selectTable(newTable.id);
        } catch (e: any) {
            f7.dialog.alert(e.message || 'Failed to create table');
        } finally {
            f7.preloader.hide();
        }
    });
}

/** Handles successful import: reloads app tables and selects the new table */
async function handleExcelImported(payload?: { table_id?: string }) {
    if (appStore.currentApp?.id) {
        f7.preloader.show();
        try {
            await appStore.fetchApp(appStore.currentApp.id);
            if (payload?.table_id) {
                await selectTable(payload.table_id);
            }
        } finally {
            f7.preloader.hide();
        }
    }
}

function handleDeleteTable(table: any) {
    f7.dialog.confirm(`Are you sure you want to delete "${table.name}"? This cannot be undone.`, async () => {
        f7.preloader.show();
        try {
            await tableStore.deleteTable(table.id);
            f7.toast.show({ text: 'Table deleted', position: 'center', closeTimeout: 2000 });

            // Reload app to sync state perfectly
            if (appStore.currentApp?.id) {
                await appStore.fetchApp(appStore.currentApp.id);
            }
        } catch (e: any) {
            f7.dialog.alert(e.message || 'Failed to delete table');
        } finally {
            f7.preloader.hide();
        }
    });
}

// ============================================================================
// Computed
// ============================================================================

const showConfigPanel = computed(() => !!selectedFieldPath.value);

// ============================================================================
// Methods
// ============================================================================

function handleFieldUpdate(updates: Partial<EditableFieldDefinition>) {
    if (selectedFieldPath.value) {
        updateField(selectedFieldPath.value, updates);
    }
}

async function handleSave() {
    if (!tableStore.currentVersion) return;

    try {
        const tableId = props.f7route.params.id || currentTableId.value;
        if (!tableId) throw new Error('No table selected');

        let version = tableStore.currentVersion.version;
        let createdNewDraft = false;

        // If current version is published, we need to create a new draft first
        if (isPublished.value || tableStore.currentVersion.published_at) {
            console.log('[handleSave] Current version is published, creating new draft...');
            f7.toast.show({ text: 'Creating new draft...', position: 'center', closeTimeout: 1000 });

            const draft = await tableStore.createDraft(tableId);
            version = draft.version;
            isPublished.value = false;
            createdNewDraft = true;

            console.log('[handleSave] Draft created, version:', version);
            f7.toast.show({ text: `Draft v${version} created`, position: 'center', closeTimeout: 1000 });
        }

        // Ensure settings are in layout
        const layoutPayload = {
            ...editorState.layout,
            settings: editorState.settings
        };

        const fieldsPayload = tableForPreview.value.fields;

        await tableStore.updateVersion(tableId, version, fieldsPayload, layoutPayload);

        // If we created a new draft, reload the table to update currentVersion in store
        if (createdNewDraft) {
            console.log('[handleSave] Reloading table to sync currentVersion...');
            await tableStore.fetchTable(tableId);
        }

        f7.toast.show({ text: 'Table saved', position: 'center', closeTimeout: 2000 });
    } catch (e: any) {
        f7.dialog.alert(e.message || 'Failed to save');
    }
}

async function handlePublish() {
    console.log('[DEBUG] handlePublish called. currentVersion:', tableStore.currentVersion);
    if (!tableStore.currentVersion) {
        console.warn('[DEBUG] handlePublish aborted: currentVersion is null');
        return;
    }
    try {
        // Prompt for optional changelog before publishing
        f7.dialog.prompt(
            'Tambahkan catatan perubahan (opsional):',
            'Publish Version',
            async (changelog: string) => {
                await handleSave(); // Save first
                const pubId = props.f7route.params.id || currentTableId.value;
                if (!pubId) return;
                await tableStore.publishVersion(pubId, tableStore.currentVersion!.version, changelog || undefined);
                f7.toast.show({ text: `Version ${currentVersion.value} published!`, position: 'center', closeTimeout: 2000 });
                isPublished.value = true; // Mark as published (read-only)

                // Reload table to refresh version list/status
                if (pubId) {
                    await tableStore.fetchTable(pubId);
                }
            },
            () => { }, // Cancel callback - do nothing
            '' // Default value - empty
        );
    } catch (e: any) {
        f7.dialog.alert(e.message);
    }
}

function handleRename() {
    f7.dialog.prompt('Enter table name', tableName.value, (name) => {
        if (name && name.trim()) {
            updateTableName(name.trim());
        }
    });
}

function handleNestedAddField(type: any, afterIndex?: number) {
    addFieldAtCurrentLevel(type, afterIndex);
}

function exportTable() {
    const data = JSON.stringify(tableForPreview.value, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${tableName.value || 'table'}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

/** Handle applying JSON changes from Code Editor Tab */
function handleCodeApply(payload: {
    fields: EditableFieldDefinition[];
    layout: LayoutConfig;
    settings: TableSettings;
}) {
    // Update state with new values from JSON
    replaceAllFields(payload.fields);
    replaceLayout(payload.layout);
    replaceSettings(payload.settings);
}

function handleBack() {
    const history = props.f7router.history;
    // If we have history, go back. 
    // Note: F7 history includes current route, so length > 1 means there is a previous route.
    if (history.length > 1) {
        props.f7router.back();
    } else {
        // Fallback for deep links (e.g. refresh on editor page)
        // Navigate to applications list with backward transition effect
        props.f7router.navigate('/applications', {
            animate: true,
            transition: 'f7-parallax' // or standard transition
        });
    }
}

// ============================================================================
// Lifecycle
// ============================================================================

onMounted(() => {
    const slug = props.f7route.params.slug;
    const tableId = props.f7route.params.id;
    const appStore = useAppStore();

    f7ready(async (f7Instance) => {
        f7Instance.preloader.show();
        try {
            let targetTableId = tableId;

            // Scenario 1: Accessed via App Slug (e.g., /editor/housing-survey)
            if (slug && !targetTableId) {
                // 1. Fetch App details
                await appStore.fetchApp(slug);

                const tables = appStore.currentApp?.tables || [];

                // 2. Auto-select if there's only 1 table and we want to reduce friction
                // In App Editor, we might want to stay on Data tab if multiple
                if (tables.length === 1) {
                    const singleTable = tables[0];
                    await selectTable(singleTable.id);
                    activeTab.value = 'fields'; // Go directly to Fields
                    f7Instance.preloader.hide();
                    return;
                }

                // 3. Multiple tables or no tables: show Data tab for selection
                if (tables.length === 0) {
                    // No tables: Reset editor state to lock dependent tabs
                    initNewTable();
                }
                activeTab.value = 'data';
                f7Instance.preloader.hide();
                return;
            }

            // Scenario 2: Have Table ID
            if (targetTableId) {
                await tableStore.fetchTable(targetTableId);
                const draft = await tableStore.createDraft(targetTableId);

                const fieldsData = draft.fields || [];
                const layoutData = draft.layout;

                loadTable(
                    String(draft.table_id || draft.id),
                    tableStore.currentTable?.name || 'Untitled',
                    fieldsData,
                    tableStore.currentTable?.description,
                    layoutData?.settings, // Settings from layout
                    layoutData,
                    tableStore.currentTable?.app_id || ''
                );

                isPublished.value = !!draft.published_at;
                currentVersion.value = draft.version || 1;
            } else {
                initNewTable();
            }

        } catch (e: any) {
            console.error('[AppEditor] Failed to load:', e);

            // Handle 404 - Table was deleted
            if (e?.response?.status === 404 || e?.message?.includes('404')) {
                f7Instance.toast.create({
                    text: 'Data source sebelumnya tidak ditemukan. Silakan pilih atau buat data source baru.',
                    position: 'center',
                    closeTimeout: 3000,
                }).open();

                // Stay on editor but switch to Data tab for new data source creation
                activeTab.value = 'data';
                initNewTable(); // Reset to blank state
            } else {
                f7Instance.dialog.alert(e.message || 'Failed to load editor');
            }
        } finally {
            f7Instance.preloader.hide();
        }
    });
});
</script>
