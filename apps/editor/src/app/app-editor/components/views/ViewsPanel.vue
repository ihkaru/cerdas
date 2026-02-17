<template>
    <div class="views-panel h-full flex flex-row">
        <!-- Sidebar: List of Views & Navigation -->
        <ViewsSidebar :views="appViewManagement.appViews.value" :navigation="navigation" :selected-key="selectedItemKey"
            :config-mode="configMode" :style="{ width: sidebarWidth + 'px' }" @select-view="selectView"
            @create-view="handleCreateView" @select-nav="selectNavItem" @create-nav="handleCreateNav"
            @nav-sorted="handleNavSorted" />

        <!-- Resizable Divider -->
        <ResizableDivider class="sidebar-divider" @resize-start="sidebarBaseWidth = sidebarWidth"
            @resize="(delta) => sidebarWidth = Math.max(200, Math.min(450, sidebarBaseWidth + delta))" />

        <!-- Main Content Wrapper: Config Panel + Divider + Spacer -->
        <div class="flex-1 flex flex-row overflow-hidden bg-gray-50 bg-opacity-50" v-if="selectedItemKey">
            <!-- Config Content (Resizable) -->
            <div class="view-config flex flex-col overflow-y-auto bg-white border-r border-gray-200"
                :style="{ width: configPanelWidth + 'px' }">

                <!-- View Configuration Mode -->
                <ViewConfigPanel v-if="configMode === 'view' && selectedView" :key="'view_' + selectedItemKey"
                    :view="selectedView" :fields="fieldsForSelectedView" :actions="availableActions"
                    :app-tables="appTables" :appViewManagement="appViewManagement" @update:viewProp="handleViewUpdate"
                    @update:deckConfig="handleDeckUpdate" @update:mapConfig="handleMapUpdate"
                    @update:groupBy="handleGroupByUpdate" @toggle-action="handleActionToggle"
                    @delete-view="handleDeleteView" />

                <!-- Navigation Configuration Mode -->
                <NavigationConfigPanel v-else-if="configMode === 'nav' && selectedNav" :key="'nav_' + selectedItemKey"
                    :nav-item="selectedNav" :available-views="appViewManagement.appViews.value"
                    @update:nav="handleNavUpdate" @delete-nav="handleDeleteNav" />
            </div>

            <!-- Resizable Divider (Right of Config) -->
            <ResizableDivider class="config-divider" @resize-start="configPanelBaseWidth = configPanelWidth"
                @resize="(delta) => configPanelWidth = Math.max(350, Math.min(1300, configPanelBaseWidth + delta))" />

            <!-- Spacer (Fills remaining space) -->
            <div class="flex-1 bg-gray-50 flex items-center justify-center">
                <!-- Optional: Empty space hint or texture -->
            </div>
        </div>

        <!-- Empty State -->
        <div v-else class="flex-1 flex items-center justify-center text-gray-400 bg-gray-50">
            <div class="text-center">
                <f7-icon f7="rectangle_split_3x1" size="48" class="mb-4 text-gray-300" />
                <p>Select a view or navigation item to configure</p>
            </div>
        </div>
    </div>
</template>


<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { ApiClient } from '../../../../common/api/ApiClient';
import { addEditorIds } from '../../composables/core/useSchemaTransform';
import { useTableEditor } from '../../composables/useTableEditor';

// Sub-components
import type { ViewDefinition } from '../../types/editor.types';
import type { NavigationItem } from '../../types/view-config.types';
import ResizableDivider from '../shared/ResizableDivider.vue';
import NavigationConfigPanel from './config/NavigationConfigPanel.vue';
import ViewConfigPanel from './config/ViewConfigPanel.vue';
import ViewsSidebar from './sidebar/ViewsSidebar.vue';

// Types for app tables
interface AppTable {
    id: string;
    name: string;
    description?: string;
}

// Props
const props = defineProps<{
    navigation: NavigationItem[];
    selectedNavKey: string;
    selectedNav: NavigationItem | undefined;
    appViewManagement: {
        appViews: { value: Record<string, ViewDefinition> };
        selectedViewKey: { value: string };
        isViewsDirty: { value: boolean };
        createView: (tableId?: string) => void;
        deleteView: (key: string) => void;
        selectView: (key: string) => void;
        updateViewProp: (key: string, prop: keyof ViewDefinition, value: unknown) => void;
        updateDeckConfigProp: (viewKey: string, key: string, value: unknown) => void;
        updateMapConfigProp: (viewKey: string, key: string, value: unknown) => void;
        toggleAction: (viewKey: string, actionId: string) => void;
        updateGroupBy: (viewKey: string, groupBy: string[]) => void;
    };
    appTables: AppTable[];
}>();

// Emits
const emit = defineEmits<{
    (e: 'update:selectedNavKey', key: string): void;
    (e: 'create-nav'): void;
    (e: 'delete-nav', id: string): void;
    (e: 'update-nav', id: string, updates: Partial<NavigationItem>): void;
    (e: 'nav-sorted', event: { from: number; to: number }): void;
}>();

// ============================================================================
// 1. Core State
// ============================================================================

const { state, fields } = useTableEditor();

// ============================================================================
// 2. Orchestration
// ============================================================================

const configMode = ref<'view' | 'nav'>('view');

// Sidebar width state for resizable panel
const sidebarWidth = ref(280);
const sidebarBaseWidth = ref(280);

// Config panel width state
const configPanelWidth = ref(700);
const configPanelBaseWidth = ref(100);

const selectedItemKey = computed(() => {
    return configMode.value === 'view' ? props.appViewManagement.selectedViewKey.value : props.selectedNavKey;
});

const selectedView = computed(() => {
    const key = props.appViewManagement.selectedViewKey.value;
    if (!key) return null;
    return props.appViewManagement.appViews.value[key] || null;
});

const availableActions = computed(() => {
    return state.settings.actions.row || [];
});

import type { EditableFieldDefinition } from '../../types/editor.types';

const fetchedFields = ref<EditableFieldDefinition[]>([]);
const isLoadingFields = ref(false);

/**
 * Get fields for the currently selected view's table_id.
 * Falls back to the currently-loaded table's fields.
 */
const fieldsForSelectedView = computed(() => {
    const viewTableId = selectedView.value?.table_id;
    const currentTableId = state.tableId;

    // 1. If view uses the same table as the main editor, use the live editor state
    // Use loose equality (==) to handle string/number type mismatches
    // eslint-disable-next-line eqeqeq
    if (!viewTableId || viewTableId == currentTableId) {
        return fields.value;
    }

    // 2. Otherwise use the fetched fields (if loaded)
    return fetchedFields.value.length > 0 ? fetchedFields.value : [];
});

async function loadViewFields(tableId: string) {
    if (!tableId || String(tableId) === String(state.tableId)) return;

    isLoadingFields.value = true;
    try {
        const res = await ApiClient.get(`/tables/${tableId}`);
        const table = res.data?.data;

        // Fields live in the version objects, not on the table directly
        const version = table?.current_version_model || table?.latest_published_version;
        const rawFields = version?.fields;

        if (rawFields && Array.isArray(rawFields)) {
            fetchedFields.value = addEditorIds(rawFields);
        } else {
            console.warn('[ViewsPanel] No fields found in table response', { tableId, hasTable: !!table, hasVersion: !!version });
            fetchedFields.value = [];
        }
    } catch (e) {
        console.error('Failed to load view fields', e);
        fetchedFields.value = [];
    } finally {
        isLoadingFields.value = false;
    }
}

// Watch for selected view changes to load fields
watch(() => selectedView.value?.table_id, (newTableId) => {
    if (newTableId && String(newTableId) !== String(state.tableId)) {
        loadViewFields(String(newTableId));
    } else {
        fetchedFields.value = [];
    }
}, { immediate: true });

// Mode Switching & Selection Handlers
function selectView(key: string) {
    configMode.value = 'view';
    // Clear nav selection (notify parent)
    emit('update:selectedNavKey', '');
    props.appViewManagement.selectView(key);
}

function selectNavItem(id: string) {
    configMode.value = 'nav';
    // Clear view selection
    props.appViewManagement.selectView('');
    emit('update:selectedNavKey', id);
}

// Update Handlers (Bridge Component Events -> Composable Methods)

function handleViewUpdate(key: string, value: unknown) {
    if (props.appViewManagement.selectedViewKey.value) {
        props.appViewManagement.updateViewProp(props.appViewManagement.selectedViewKey.value, key as keyof ViewDefinition, value);
    }
}

function handleDeckUpdate(key: string, value: unknown) {
    if (props.appViewManagement.selectedViewKey.value) {
        props.appViewManagement.updateDeckConfigProp(props.appViewManagement.selectedViewKey.value, key, value);
    }
}

function handleMapUpdate(key: string, value: unknown) {
    if (props.appViewManagement.selectedViewKey.value) {
        props.appViewManagement.updateMapConfigProp(props.appViewManagement.selectedViewKey.value, key, value);
    }
}

function handleActionToggle(actionId: string) {
    if (props.appViewManagement.selectedViewKey.value) {
        props.appViewManagement.toggleAction(props.appViewManagement.selectedViewKey.value, actionId);
    }
}

function handleGroupByUpdate(groupBy: string[]) {
    if (props.appViewManagement.selectedViewKey.value) {
        props.appViewManagement.updateGroupBy(props.appViewManagement.selectedViewKey.value, groupBy);
    }
}

function handleDeleteView() {
    if (props.appViewManagement.selectedViewKey.value) {
        props.appViewManagement.deleteView(props.appViewManagement.selectedViewKey.value);
    }
}

function handleCreateView() {
    // Auto-set table_id to the currently loaded table (if any)
    const currentTableId = state.tableId || undefined;
    props.appViewManagement.createView(currentTableId);
}

function handleNavUpdate(updates: Partial<NavigationItem>) {
    if (props.selectedNavKey) {
        emit('update-nav', props.selectedNavKey, updates);
    }
}

function handleDeleteNav() {
    if (props.selectedNavKey) {
        emit('delete-nav', props.selectedNavKey);
    }
}

function handleCreateNav() {
    emit('create-nav');
}

function handleNavSorted(event: { from: number; to: number }) {
    emit('nav-sorted', event);
}

// Lifecycle
onMounted(() => {
    // Auto-select first view if nothing selected
    if (!props.appViewManagement.selectedViewKey.value && !props.selectedNavKey && props.appViewManagement.appViews.value) {
        const firstKey = Object.keys(props.appViewManagement.appViews.value)[0];
        if (firstKey) {
            selectView(firstKey);
        }
    }
});

// Watchers to keep mode in sync if programmatic changes occur
watch(() => props.appViewManagement.selectedViewKey.value, (newVal) => {
    if (newVal) configMode.value = 'view';
});

watch(() => props.selectedNavKey, (newVal) => {
    if (newVal) configMode.value = 'nav';
});

</script>

<style scoped>
.views-panel {
    height: 100%;
    display: flex;
    flex-direction: row;
    overflow: hidden;
    /* Parent must not scroll, children will */
}

.view-config {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
    background-color: white;
}

/* Utility classes */
.flex {
    display: flex;
}

.flex-1 {
    flex: 1;
}

.flex-row {
    flex-direction: row;
}

.h-full {
    height: 100%;
}

.items-center {
    align-items: center;
}

.justify-center {
    justify-content: center;
}

.justify-between {
    justify-content: space-between;
}

.text-center {
    text-align: center;
}

.text-gray-400 {
    color: #9ca3af;
}

.text-gray-300 {
    color: #d1d5db;
}

.bg-gray-50 {
    background-color: #f9fafb;
}

.bg-white {
    background-color: white;
}

.p-4 {
    padding: 1rem;
}

.mb-4 {
    margin-bottom: 1rem;
}

.mb-6 {
    margin-bottom: 1.5rem;
}

.pb-4 {
    padding-bottom: 1rem;
}

.text-xl {
    font-size: 1.25rem;
}

.font-semibold {
    font-weight: 600;
}

.gap-2 {
    gap: 0.5rem;
}

.border-b {
    border-bottom-width: 1px;
    border-bottom-style: solid;
}

.border-gray-100 {
    border-color: #f3f4f6;
}

.text-blue-500 {
    color: #3b82f6;
}

.sidebar-divider {
    background: #f8fafc;
    border-right: 1px solid #e2e8f0;
}

.sidebar-divider:hover,
.sidebar-divider.dragging {
    background: #e2e8f0;
}

.sidebar-divider :deep(.divider-handle) {
    background: #cbd5e1;
}

.sidebar-divider:hover :deep(.divider-handle),
.sidebar-divider.dragging :deep(.divider-handle) {
    background: #3b82f6;
}

.config-divider {
    background: #f8fafc;
    border-right: 1px solid #e2e8f0;
    border-left: 1px solid #f1f5f9;
}

.config-divider:hover,
.config-divider.dragging {
    background: #e2e8f0;
}
</style>
