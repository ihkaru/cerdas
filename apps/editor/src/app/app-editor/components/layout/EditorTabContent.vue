<template>
    <div class="editor-tab-content h-full">
        <!-- Schema Tab (Sources + Fields merged) -->
        <div v-show="activeTab === 'schema'" class="tab-content">
            <!-- Left: Data Sources List -->
            <div class="field-list-panel"
                :style="{ width: panels.dataListWidth + 'px', minWidth: '250px', maxWidth: '500px' }">
                <div class="panel-header">
                    <span class="panel-title">Data Sources</span>
                    <div class="panel-header-actions">
                        <!-- Ghost icon button for secondary/destructive actions -->
                        <button class="panel-icon-btn" @click="showTrashModal = true" title="View Trash">
                            <f7-icon f7="trash_slash" size="14" />
                        </button>
                        <!-- Primary action button -->
                        <button class="panel-primary-btn" @click="tableSelection.createNewTable">
                            <f7-icon f7="plus" size="12" />
                            New
                        </button>
                    </div>
                </div>
                <div class="field-list-scroll">
                    <div v-if="tableSelection.loadingTables" class="start-message">Loading...</div>
                    <div v-else-if="!tableSelection.appTables.length" class="start-message">
                        No tables found. Create one to start.
                    </div>
                    <div v-else class="form-list">
                        <div v-for="table in tableSelection.appTables" :key="table.id" class="form-item"
                            :class="{ 'active': tableSelection.currentTableId === table.id }"
                            @click="tableSelection.selectTable(table.id)">
                            <div class="form-icon-wrapper">
                                <f7-icon f7="doc_text_fill" size="18" />
                            </div>
                            <div class="form-details">
                                <div class="form-title">{{ table.name }}</div>
                                <div class="form-desc">{{ table.description || 'No description' }}</div>
                            </div>
                            <div v-if="tableSelection.currentTableId === table.id" class="active-check">
                                <f7-icon f7="checkmark_circle_fill" size="16" />
                            </div>
                            <button class="form-action-btn" @click.stop="tableSelection.handleDeleteTable(table)" title="Delete">
                                <f7-icon f7="trash" size="14" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <ResizableDivider @resize-start="panels.dataListBaseWidth = panels.dataListWidth"
                @resize="(delta) => panels.dataListWidth = Math.max(250, Math.min(500, panels.dataListBaseWidth + delta))" />

            <!-- Right: Fields (inline when table selected) -->
            <template v-if="tableSelection.hasTableSelected">
                <div class="field-list-panel"
                    :style="{ 
                        width: tableEditor.selectedFieldPath ? panels.fieldListWidth + 'px' : '100%', 
                        flex: tableEditor.selectedFieldPath ? '0 0 auto' : '1 1 0%',
                        minWidth: '250px', 
                        maxWidth: tableEditor.selectedFieldPath ? '600px' : 'none' 
                    }">
                    <FieldList :fields="tableEditor.currentFields" :breadcrumbs="tableEditor.breadcrumbs"
                        :selected-path="tableEditor.selectedFieldPath" @select="tableEditor.selectField"
                        @add="(type, idx) => tableEditor.addFieldAtCurrentLevel(type, idx)"
                        @delete="tableEditor.removeField" @duplicate="tableEditor.duplicateField"
                        @reorder="tableEditor.reorderFieldsAtCurrentLevel" @drill-in="tableEditor.drillInto"
                        @drill-up="tableEditor.drillUp" @drill-to="tableEditor.drillToPath" />
                </div>
                <ResizableDivider v-if="!!tableEditor.selectedFieldPath"
                    @resize-start="panels.fieldListBaseWidth = panels.fieldListWidth"
                    @resize="(delta) => panels.fieldListWidth = Math.max(250, Math.min(600, panels.fieldListBaseWidth + delta))" />
                <div v-if="!!tableEditor.selectedFieldPath" class="field-config-panel">
                    <FieldConfigPanel :field="tableEditor.selectedField"
                        :original-field="tableEditor.selectedOriginalField" :all-fields="tableEditor.currentFields"
                        @close="tableEditor.clearSelection" @reset="$emit('reset-field')"
                        @update="(updates) => tableEditor.updateField(tableEditor.selectedFieldPath, updates)" />
                </div>
            </template>
            <div v-else class="field-config-panel empty-selection-placeholder">
                Select a data source to edit its fields
            </div>
        </div>

        <!-- Settings Tab -->
        <div v-show="activeTab === 'settings'" class="tab-content">
            <div class="settings-scroll">
                <AppSettingsPanel :settings="tableEditor.state.settings" @update="tableEditor.updateSettings" />
            </div>
        </div>

        <!-- Views Tab -->
        <div v-show="activeTab === 'views'" class="tab-content">
            <ViewsPanel :navigation="navManagement.navigation" :selected-nav-key="navManagement.selectedNavKey"
                :selected-nav="navManagement.selectedNav" :app-view-management="appViewManagement"
                :app-tables="tableSelection.appTables" @update:selected-nav-key="navManagement.selectNavItem"
                @create-nav="navManagement.createNavItem" @delete-nav="navManagement.deleteNavItem"
                @update-nav="navManagement.updateNavItem" @nav-sorted="navManagement.onNavSort" />
        </div>

        <!-- Actions Tab -->
        <div v-show="activeTab === 'actions'" class="tab-content">
            <EditorEmptyState v-if="!tableSelection.hasTableSelected" icon="bolt" title="No Data Source Selected"
                action-label="Go to Data Sources" @action="$emit('update:activeTab', 'schema')">
                Select a data source from the <strong>Schema</strong> tab to configure actions.
            </EditorEmptyState>
            <ActionsPanel v-else />
        </div>

        <!-- Data & Monitoring (Submissions) Tab -->
        <div v-show="activeTab === 'data_monitoring'" class="tab-content h-full">
            <SubmissionsPanel />
        </div>

        <!-- Code Tab -->
        <div v-show="activeTab === 'code'" class="tab-content code-content">
            <template v-if="true">
                <div class="code-editor-panel"
                    :style="{ width: panels.codeEditorWidth + 'px', minWidth: '400px', maxWidth: '1000px' }">
                    <CodeEditorTab 
                        @apply="(payload) => $emit('code-apply', payload)" />
                </div>
                <ResizableDivider @resize-start="panels.codeEditorBaseWidth = panels.codeEditorWidth"
                    @resize="(delta) => panels.codeEditorWidth = Math.max(400, Math.min(1000, panels.codeEditorBaseWidth + delta))" />
                <div class="code-preview-placeholder">
                    <f7-icon f7="doc_text" size="48" />
                    <p>JSON Preview Area</p>
                    <small>Drag the divider to resize the editor</small>
                </div>
            </template>
        </div>

        <!-- Trash Modal for Soft-Deleted Data Sources -->
        <TrashModal v-model:opened="showTrashModal" :app-id="tableSelection.appTables?.[0]?.app_id" />
    </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';

// Layout Components
import EditorEmptyState from '../shared/EditorEmptyState.vue';
import ResizableDivider from '../shared/ResizableDivider.vue';

// Tab Components
import ActionsPanel from '../actions/ActionsPanel.vue';
import SubmissionsPanel from '../monitoring/SubmissionsPanel.vue';
import CodeEditorTab from '../code/CodeEditorTab.vue';
import TrashModal from '../data/TrashModal.vue';
import FieldConfigPanel from '../field-config/FieldConfigPanel.vue';
import FieldList from '../field-list/FieldList.vue';
import AppSettingsPanel from '../settings/AppSettingsPanel.vue';
import ViewsPanel from '../views/ViewsPanel.vue';

const props = defineProps<{
    activeTab: string;
    panels: any;
    tableEditor: any;
    navManagement: any;
    tableSelection: any;
    appViewManagement: any;
}>();

defineEmits<{
    'update:activeTab': [value: string];
    'reset-field': [];
    'code-apply': [payload: any];
}>();

// reactive() properly unwraps nested Refs inside composable return objects.
// This is intentional: composables return plain objects of refs, and reactive()
// unwraps them so child components receive plain values, not Ref<T> wrappers.
const panels = reactive(props.panels);
const tableEditor = reactive(props.tableEditor);
const navManagement = reactive(props.navManagement);
const tableSelection = reactive(props.tableSelection);
const appViewManagement = props.appViewManagement;

// Local UI State
const showTrashModal = ref(false);
</script>

<style scoped>
.panel-header-actions {
    display: flex;
    align-items: center;
    gap: 6px;
}

/*
 * panel-icon-btn: Ghost icon-only button for secondary/destructive header actions.
 * Turns red on hover — signals destructive intent without dominating the header.
 */
.panel-icon-btn {
    all: unset;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 6px;
    color: #64748b;
    transition: background 0.15s, color 0.15s;
}

.panel-icon-btn:hover {
    background: rgba(239, 68, 68, 0.08);
    color: #ef4444;
}

/*
 * panel-primary-btn: Filled pill for primary header actions.
 * Consistent across all panel headers ("New", "Add Field", etc.).
 */
.panel-primary-btn {
    all: unset;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 0 10px;
    height: 28px;
    border-radius: 6px;
    background: #3b82f6;
    color: white;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.01em;
    transition: background 0.15s, transform 0.1s;
    white-space: nowrap;
}

.panel-primary-btn:hover {
    background: #2563eb;
}

.panel-primary-btn:active {
    transform: scale(0.97);
}

/*
 * form-action-btn: Hover-reveal destructive button inside list items.
 * Invisible until parent .form-item is hovered.
 */
.form-action-btn {
    all: unset;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    border-radius: 5px;
    color: #94a3b8;
    opacity: 0;
    transition: opacity 0.15s, background 0.15s, color 0.15s;
}

.form-item:hover .form-action-btn,
.form-item.active .form-action-btn {
    opacity: 1;
}

.form-action-btn:hover {
    background: rgba(239, 68, 68, 0.08);
    color: #ef4444;
}
</style>
