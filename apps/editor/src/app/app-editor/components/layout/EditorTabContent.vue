<template>
    <div class="editor-tab-content h-full">
        <!-- Data Tab (Tables List) -->
        <div v-show="activeTab === 'data'" class="tab-content">
            <div class="field-list-panel"
                :style="{ width: panels.dataListWidth + 'px', minWidth: '250px', maxWidth: '500px' }">
                <div class="panel-header">
                    <span class="panel-title">Data Sources</span>
                    <f7-button small fill round @click="tableSelection.createNewTable">
                        <f7-icon f7="plus" size="14" /> New
                    </f7-button>
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
                            <div class="form-actions" @click.stop="tableSelection.handleDeleteTable(table)">
                                <f7-icon f7="trash" size="16" class="text-color-gray" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <ResizableDivider @resize-start="panels.dataListBaseWidth = panels.dataListWidth"
                @resize="(delta) => panels.dataListWidth = Math.max(250, Math.min(500, panels.dataListBaseWidth + delta))" />

            <div class="field-config-panel empty-selection-placeholder">
                Select a data source to edit its fields
            </div>
        </div>

        <!-- Tab Contents -->
        <div v-show="activeTab === 'fields'" class="tab-content fields-content">
            <EditorEmptyState v-if="!tableSelection.hasTableSelected" icon="doc_text" title="No Data Source Selected"
                action-label="Go to Data Sources" @action="$emit('update:activeTab', 'data')">
                Select a data source from the <strong>Data</strong> tab to edit its fields.
            </EditorEmptyState>
            <template v-else>
                <div class="field-list-panel"
                    :style="{ width: panels.fieldListWidth + 'px', minWidth: '250px', maxWidth: '600px' }">
                    <div class="field-list-scroll">
                        <FieldList :fields="tableEditor.currentFields" :breadcrumbs="tableEditor.breadcrumbs"
                            :selected-path="tableEditor.selectedFieldPath" @select="tableEditor.selectField"
                            @add="(type, idx) => tableEditor.addFieldAtCurrentLevel(type, idx)"
                            @delete="tableEditor.removeField" @duplicate="tableEditor.duplicateField"
                            @reorder="tableEditor.reorderFieldsAtCurrentLevel" @drill-in="tableEditor.drillInto"
                            @drill-up="tableEditor.drillUp" @drill-to="tableEditor.drillToPath" />
                    </div>
                </div>
                <!-- Note: using showConfigPanel computed locally or check selectedFieldPath directly -->
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
        </div>

        <!-- Settings Tab -->
        <div v-show="activeTab === 'settings'" class="tab-content">
            <div class="settings-scroll">
                <AppSettingsPanel :settings="tableEditor.state.settings" @update="tableEditor.updateSettings" />
            </div>
        </div>

        <!-- Views Tab -->
        <div v-show="activeTab === 'views'" class="tab-content">
            <EditorEmptyState v-if="!tableSelection.hasTableSelected" icon="rectangle_3_offgrid"
                title="No Data Source Selected" action-label="Go to Data Sources"
                @action="$emit('update:activeTab', 'data')">
                Select a data source from the <strong>Data</strong> tab to configure views.
            </EditorEmptyState>
            <ViewsPanel v-else :navigation="navManagement.navigation" :selected-nav-key="navManagement.selectedNavKey"
                :selected-nav="navManagement.selectedNav" @update:selected-nav-key="navManagement.selectNavItem"
                @create-nav="navManagement.createNavItem" @delete-nav="navManagement.deleteNavItem"
                @update-nav="navManagement.updateNavItem" @nav-sorted="navManagement.onNavSort" />
        </div>

        <!-- Actions Tab -->
        <div v-show="activeTab === 'actions'" class="tab-content">
            <EditorEmptyState v-if="!tableSelection.hasTableSelected" icon="bolt" title="No Data Source Selected"
                action-label="Go to Data Sources" @action="$emit('update:activeTab', 'data')">
                Select a data source from the <strong>Data</strong> tab to configure actions.
            </EditorEmptyState>
            <ActionsPanel v-else />
        </div>

        <!-- Assignments Tab -->
        <div v-show="activeTab === 'assignments'" class="tab-content">
            <EditorEmptyState v-if="!tableSelection.hasTableSelected" icon="person_2" title="No Data Source Selected"
                action-label="Go to Data Sources" @action="$emit('update:activeTab', 'data')">
                Select a data source from the <strong>Data</strong> tab to manage assignments.
            </EditorEmptyState>
            <AssignmentsPanel v-else />
        </div>

        <!-- Code Tab -->
        <div v-show="activeTab === 'code'" class="tab-content code-content">
            <EditorEmptyState v-if="!tableSelection.hasTableSelected" icon="chevron_left_slash_chevron_right"
                title="No Data Source Selected" action-label="Go to Data Sources"
                @action="$emit('update:activeTab', 'data')">
                Select a data source from the <strong>Data</strong> tab to edit its JSON.
            </EditorEmptyState>
            <template v-else>
                <div class="code-editor-panel"
                    :style="{ width: panels.codeEditorWidth + 'px', minWidth: '400px', maxWidth: '1000px' }">
                    <CodeEditorTab :table-id="tableSelection.currentTableId" :table-name="tableEditor.tableName"
                        :fields="tableEditor.tableForPreview.fields" :layout="tableEditor.state.layout"
                        :settings="tableEditor.state.settings" @apply="(payload) => $emit('code-apply', payload)" />
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
    </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue';

// Layout Components
import EditorEmptyState from '../shared/EditorEmptyState.vue';
import ResizableDivider from '../shared/ResizableDivider.vue';

// Tab Components
import ActionsPanel from '../actions/ActionsPanel.vue';
import AssignmentsPanel from '../assignments/AssignmentsPanel.vue';
import CodeEditorTab from '../code/CodeEditorTab.vue';
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
}>();

defineEmits<{
    'update:activeTab': [value: string];
    'reset-field': [];
    'code-apply': [payload: any];
}>();

// Wrap props in reactive to unwrap refs for template usage
const panels = reactive(props.panels);
const tableEditor = reactive(props.tableEditor);
const navManagement = reactive(props.navManagement);
const tableSelection = reactive(props.tableSelection);
</script>
