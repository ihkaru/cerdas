<template>
    <EditorShell>
        <template #header>
            <EditorHeader :title="schemaName" :is-dirty="isDirty" :is-published="isPublished" @rename="handleRename"
                @save="handleSave" @publish="handlePublish" @back="props.f7router.back()" @export="exportSchema" />
        </template>

        <template #sidebar>
            <EditorSidebar v-model="activeTab" :has-form-selected="hasFormSelected" />
        </template>

        <template #main>
            <!-- Data Tab (Schemas List) -->
            <div v-show="activeTab === 'data'" class="tab-content">
                <div class="field-list-panel"
                    :style="{ width: dataListWidth + 'px', minWidth: '250px', maxWidth: '500px' }">
                    <div class="panel-header">
                        <span class="panel-title">Data Sources</span>
                        <f7-button small fill round @click="createNewForm">
                            <f7-icon f7="plus" size="14" /> New
                        </f7-button>
                    </div>
                    <div class="field-list-scroll">
                        <div v-if="loadingForms" class="start-message">Loading...</div>
                        <div v-else-if="!appForms.length" class="start-message">
                            No forms found. Create one to start.
                        </div>
                        <div v-else class="form-list">
                            <div v-for="form in appForms" :key="form.id" class="form-item"
                                :class="{ 'active': currentFormId === form.id }" @click="selectForm(form.id)">
                                <div class="form-icon-wrapper">
                                    <f7-icon f7="doc_text_fill" size="18" />
                                </div>
                                <div class="form-details">
                                    <div class="form-title">{{ form.name }}</div>
                                    <div class="form-desc">{{ form.description || 'No description' }}</div>
                                </div>
                                <div v-if="currentFormId === form.id" class="active-check">
                                    <f7-icon f7="checkmark_circle_fill" size="16" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <ResizableDivider @resize-start="dataListBaseWidth = dataListWidth"
                    @resize="(delta) => dataListWidth = Math.max(250, Math.min(500, dataListBaseWidth + delta))" />

                <!-- Preview or Detail of selected form? For now, empty or duplicate preview -->
                <div class="field-config-panel empty-selection-placeholder">
                    Select a data source to edit its schema
                </div>
            </div>

            <!-- Tab Contents -->
            <div v-show="activeTab === 'fields'" class="tab-content fields-content">
                <!-- Empty state when no form selected -->
                <div v-if="!hasFormSelected" class="empty-state-container">
                    <div class="empty-state">
                        <f7-icon f7="doc_text" class="empty-state-icon" />
                        <h3>No Data Source Selected</h3>
                        <p>Select a data source from the <strong>Data</strong> tab to edit its fields.</p>
                        <f7-button fill round @click="activeTab = 'data'">Go to Data Sources</f7-button>
                    </div>
                </div>
                <!-- Normal content when form is selected -->
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
                <!-- Empty state when no form selected -->
                <div v-if="!hasFormSelected" class="empty-state-container">
                    <div class="empty-state">
                        <f7-icon f7="rectangle_3_offgrid" class="empty-state-icon" />
                        <h3>No Data Source Selected</h3>
                        <p>Select a data source from the <strong>Data</strong> tab to configure views.</p>
                        <f7-button fill round @click="activeTab = 'data'">Go to Data Sources</f7-button>
                    </div>
                </div>
                <!-- Normal content when form is selected -->
                <ViewsPanel v-else />
            </div>

            <!-- Actions Tab -->
            <div v-show="activeTab === 'actions'" class="tab-content">
                <div v-if="!hasFormSelected" class="empty-state-container">
                    <div class="empty-state">
                        <f7-icon f7="bolt" class="empty-state-icon" />
                        <h3>No Data Source Selected</h3>
                        <p>Select a data source from the <strong>Data</strong> tab to configure actions.</p>
                        <f7-button fill round @click="activeTab = 'data'">Go to Data Sources</f7-button>
                    </div>
                </div>
                <ActionsPanel v-else />
            </div>

            <!-- Assignments Tab -->
            <div v-show="activeTab === 'assignments'" class="tab-content">
                <div v-if="!hasFormSelected" class="empty-state-container">
                    <div class="empty-state">
                        <f7-icon f7="person_2" class="empty-state-icon" />
                        <h3>No Data Source Selected</h3>
                        <p>Select a data source from the <strong>Data</strong> tab to manage assignments.</p>
                        <f7-button fill round @click="activeTab = 'data'">Go to Data Sources</f7-button>
                    </div>
                </div>
                <AssignmentsPanel v-else />
            </div>
        </template>

        <template #preview>
            <EditorPreviewPanel />
        </template>
    </EditorShell>
</template>

<script setup lang="ts">
import { useAppStore, useFormStore } from '@/stores';
import { f7, f7ready } from 'framework7-vue';
import { computed, onMounted, ref } from 'vue';

// Layout Components
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
import AppSettingsPanel from './components/settings/AppSettingsPanel.vue';
import ViewsPanel from './components/views/ViewsPanel.vue';

// Shared Components
import ResizableDivider from './components/shared/ResizableDivider.vue';

// Composables
import { useSchemaEditor } from './composables/useSchemaEditor';
import type { EditableFieldDefinition } from './types/editor.types';

const props = defineProps<{
    f7route: any;
    f7router: any;
}>();

const formStore = useFormStore();

// ============================================================================
// State from Composable
// ============================================================================

const {
    schemaName,
    selectedFieldPath,
    isDirty,
    selectedField,
    schemaForPreview,
    state: editorState,
    currentFields,
    breadcrumbs,
    initNewSchema,
    loadSchema,
    updateSchemaName,
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
    updateSettings
} = useSchemaEditor();

// ============================================================================
// Local State
// ============================================================================

const activeTab = ref('fields');
const isPublished = ref(false);
const appStore = useAppStore();
const currentFormId = computed(() => Number(editorState.schemaId));

// App Forms Logic
const appForms = computed(() => appStore.currentApp?.forms || []);
const loadingForms = computed(() => appStore.loading);

// Check if a form is currently selected (for disabling tabs)
const hasFormSelected = computed(() => !!editorState.schemaId && editorState.schemaId !== '');

// Panel Widths (for resizable panels)
const fieldListWidth = ref(350);
const fieldListBaseWidth = ref(350);
const dataListWidth = ref(300);
const dataListBaseWidth = ref(300);

async function selectForm(id: number) {
    if (id === currentFormId.value) return;

    f7.preloader.show();
    try {
        await formStore.fetchForm(id);
        const draft = await formStore.createDraft(id);

        loadSchema(
            String(draft.form_id),
            formStore.currentForm?.name || 'Untitled',
            draft.schema?.fields || [],
            formStore.currentForm?.description,
            draft.schema?.settings,
            draft.layout,
            draft.app_id
        );
        isPublished.value = !!draft.published_at;
    } catch (e: any) {
        f7.dialog.alert(e.message);
    } finally {
        f7.preloader.hide();
    }
}

function createNewForm() {
    f7.dialog.prompt('New Form Name', async (name) => {
        if (!name) return;
        f7.preloader.show();
        try {
            // Logic to create form via store (to be implemented in formStore if missing)
            // For now alerting
            f7.dialog.alert('Creation logic pending API update');
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
    if (!formStore.currentVersion) return;

    try {
        const formId = Number(props.f7route.params.id);
        const version = formStore.currentVersion.version;

        const schemaPayload = {
            fields: schemaForPreview.value.fields,
            settings: editorState.settings
        };

        const layoutPayload = editorState.layout;

        await formStore.updateVersion(formId, version, schemaPayload, layoutPayload);

        f7.toast.show({ text: 'Form saved', position: 'center', closeTimeout: 2000 });
    } catch (e: any) {
        f7.dialog.alert(e.message || 'Failed to save');
    }
}

async function handlePublish() {
    if (!formStore.currentVersion) return;
    try {
        f7.dialog.confirm('Are you sure you want to publish this version?', async () => {
            await handleSave(); // Save first
            await formStore.publishVersion(Number(props.f7route.params.id), formStore.currentVersion!.version);
            f7.toast.show({ text: 'Version published!', position: 'center', closeTimeout: 2000 });
            isPublished.value = true;
        });
    } catch (e: any) {
        f7.dialog.alert(e.message);
    }
}

function handleRename() {
    f7.dialog.prompt('Enter form name', schemaName.value, (name) => {
        if (name && name.trim()) {
            updateSchemaName(name.trim());
        }
    });
}

function handleNestedAddField(type: any, afterIndex?: number) {
    addFieldAtCurrentLevel(type, afterIndex);
}

function exportSchema() {
    const data = JSON.stringify(schemaForPreview.value, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${schemaName.value || 'schema'}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

// ============================================================================
// Lifecycle
// ============================================================================

onMounted(() => {
    const slug = props.f7route.params.slug;
    const formId = props.f7route.params.id;
    const appStore = useAppStore();

    f7ready(async (f7Instance) => {
        f7Instance.preloader.show();
        try {
            let targetFormId = formId;

            // Scenario 1: Accessed via App Slug (e.g., /apps/housing-survey)
            if (slug && !targetFormId) {
                // 1. Fetch App details (void return)
                await appStore.fetchApp(slug);

                const forms = appStore.currentApp?.forms || [];

                // 2. Auto-select if there's only 1 form (reduce friction)
                if (forms.length === 1) {
                    const singleForm = forms[0];
                    await selectForm(singleForm.id);
                    activeTab.value = 'fields'; // Go directly to Fields
                    f7Instance.preloader.hide();
                    return;
                }

                // 3. Multiple forms or no forms: show Data tab for selection
                activeTab.value = 'data';
                f7Instance.preloader.hide();
                return;
            }

            // Scenario 2: Have Form ID (either from params or fetched from App)
            if (targetFormId) {
                await formStore.fetchForm(targetFormId);
                const draft = await formStore.createDraft(Number(targetFormId));

                const fieldsData = draft.schema?.fields || [];
                const settingsData = draft.schema?.settings;
                const layoutData = draft.layout;

                loadSchema(
                    String(draft.form_id),
                    formStore.currentForm?.name || 'Untitled',
                    fieldsData,
                    formStore.currentForm?.description,
                    settingsData,
                    layoutData,
                    draft.app_id || formStore.currentForm?.app_id
                );

                isPublished.value = !!draft.published_at;
            } else {
                initNewSchema();
            }

        } catch (e: any) {
            console.error('[AppEditor] Failed to load:', e);
            f7Instance.dialog.alert(e.message || 'Failed to load editor');
        } finally {
            f7Instance.preloader.hide();
        }
    });
});
</script>

<style scoped>
/* Existing Styles */
.tab-content {
    width: 100%;
    height: 100%;
    display: flex;
    overflow: hidden;
}

.fields-content {
    display: flex;
}

.field-list-panel {
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: white;
    border-right: 1px solid #e2e8f0;
}

.field-list-scroll {
    flex: 1;
    overflow-y: auto;
    padding: 8px;
}

.field-config-panel {
    flex: 1;
    overflow: hidden;
    overflow-y: auto;
    background: white;
}

.settings-scroll {
    width: 100%;
    overflow-y: auto;
    background: white;
}

/* ============================================================================
   Data Tab Styles (Replaces Tailwind)
   ============================================================================ */

.panel-header {
    padding: 16px;
    border-bottom: 1px solid #e2e8f0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #fff;
}

.panel-title {
    font-weight: 600;
    color: #374151;
    /* gray-700 */
    font-size: 16px;
}

.start-message {
    text-align: center;
    padding: 24px;
    color: #6b7280;
    /* gray-500 */
}

.form-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.form-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    background: #fff;
    border: 1px solid #e5e7eb;
    /* gray-200 */
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
}

.form-item:hover {
    background-color: #f9fafb;
    /* gray-50 */
    border-color: #d1d5db;
    /* gray-300 */
}

.form-item.active {
    border-color: #3b82f6;
    /* blue-500 */
    box-shadow: 0 0 0 1px #3b82f6;
    /* ring-1 ring-blue-500 */
    background-color: #eff6ff;
    /* blue-50 */
}

.form-icon-wrapper {
    width: 32px;
    height: 32px;
    border-radius: 6px;
    background-color: #dbeafe;
    /* blue-100 */
    color: #2563eb;
    /* blue-600 */
    display: flex;
    align-items: center;
    justify-content: center;
}

.form-details {
    flex: 1;
    min-width: 0;
}

.form-title {
    font-weight: 500;
    color: #111827;
    /* gray-900 */
    font-size: 14px;
    margin-bottom: 2px;
}

.form-desc {
    font-size: 12px;
    color: #6b7280;
    /* gray-500 */
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.active-check {
    color: #2563eb;
    /* blue-600 */
}

.empty-selection-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #f9fafb;
    /* gray-50 */
    color: #9ca3af;
    /* gray-400 */
    height: 100%;
    font-size: 14px;
}

/* Empty State Styling for Tabs */
.empty-state-container {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
}

.empty-state {
    text-align: center;
    padding: 48px;
    max-width: 400px;
}

.empty-state-icon {
    font-size: 56px !important;
    color: #cbd5e1;
    margin-bottom: 16px;
}

.empty-state h3 {
    margin: 0 0 8px 0;
    font-size: 18px;
    font-weight: 600;
    color: #334155;
}

.empty-state p {
    margin: 0 0 20px 0;
    font-size: 14px;
    color: #64748b;
    line-height: 1.5;
}

.empty-state p strong {
    color: #3b82f6;
}
</style>
