<template>
    <EditorShell>
        <template #header>
            <EditorHeader :title="schemaName" :is-dirty="isDirty" :is-published="isPublished" @rename="handleRename"
                @save="handleSave" @publish="handlePublish" @back="props.f7router.back()" @export="exportSchema" />
        </template>

        <template #sidebar>
            <EditorSidebar v-model="activeTab" />
        </template>

        <template #main>
            <!-- Tab Contents -->
            <div v-show="activeTab === 'fields'" class="tab-content fields-content">
                <div class="field-list-panel">
                    <div class="field-list-scroll">
                        <FieldList :fields="currentFields" :breadcrumbs="breadcrumbs" :selected-path="selectedFieldPath"
                            @select="selectField" @add="handleNestedAddField" @delete="removeField"
                            @duplicate="duplicateField" @reorder="reorderFieldsAtCurrentLevel" @drill-in="drillInto"
                            @drill-up="drillUp" @drill-to="drillToPath" />
                    </div>
                </div>
                <div v-if="showConfigPanel" class="field-config-panel">
                    <FieldConfigPanel :field="selectedField" @close="clearSelection" @update="handleFieldUpdate" />
                </div>
            </div>

            <!-- Settings Tab -->
            <div v-show="activeTab === 'settings'" class="tab-content">
                <div class="settings-scroll">
                    <AppSettingsPanel :settings="editorState.settings" @update="updateSettings" />
                </div>
            </div>

            <!-- Views Tab -->
            <div v-show="activeTab === 'views'" class="tab-content">
                <ViewsPanel />
            </div>

            <!-- Actions Tab -->
            <div v-show="activeTab === 'actions'" class="tab-content">
                <ActionsPanel />
            </div>

            <!-- Assignments Tab -->
            <div v-show="activeTab === 'assignments'" class="tab-content">
                <AssignmentsPanel />
            </div>
        </template>

        <template #preview>
            <EditorPreviewPanel />
        </template>
    </EditorShell>
</template>

<script setup lang="ts">
import { useFormStore } from '@/stores';
import { f7, f7ready } from 'framework7-vue';
import { computed, onMounted, ref } from 'vue';

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
    fields,
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
    addField,
    updateField,
    removeField,
    reorderFields,
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
    const formId = props.f7route.params.id;

    f7ready(async (f7Instance) => {
        if (formId) {
            f7Instance.preloader.show();

            try {
                await formStore.fetchForm(formId);
                // Get draft (enter edit mode)
                const draft = await formStore.createDraft(Number(formId));

                // Load schema into editor
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
                    draft.app_id || formStore.currentForm?.app_id // Pass appId
                );

                isPublished.value = !!draft.published_at;

            } catch (e: any) {
                console.error('[FormEditor] Failed to load form:', e);
                f7Instance.dialog.alert(e.message || 'Failed to load form');
                props.f7router?.back();
            } finally {
                f7Instance.preloader.hide();
            }
        } else {
            initNewSchema();
        }
    });
});
</script>

<style scoped>
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
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: white;
    border-right: 1px solid #e2e8f0;
    min-width: 300px;
    max-width: 400px;
}

.field-list-scroll {
    flex: 1;
    overflow-y: auto;
}

.field-config-panel {
    flex: 1;
    overflow: hidden;
    background: white;
}

.settings-scroll {
    width: 100%;
    overflow-y: auto;
    background: white;
}
</style>
