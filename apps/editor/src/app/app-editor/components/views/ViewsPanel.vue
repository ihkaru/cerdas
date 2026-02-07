<template>
    <div class="views-panel h-full flex flex-row">
        <!-- Sidebar: List of Views & Navigation -->
        <ViewsSidebar :views="localLayout.views" :navigation="navigation" :selected-key="selectedItemKey"
            :config-mode="configMode" :style="{ width: sidebarWidth + 'px' }" @select-view="selectView"
            @create-view="createView" @select-nav="selectNavItem" @create-nav="createNavItem" @nav-sorted="onNavSort" />

        <!-- Resizable Divider -->
        <ResizableDivider class="sidebar-divider" @resize-start="sidebarBaseWidth = sidebarWidth"
            @resize="(delta) => sidebarWidth = Math.max(200, Math.min(450, sidebarBaseWidth + delta))" />

        <!-- Main Content Wrapper: Config Panel + Divider + Spacer -->
        <div class="flex-1 flex flex-row overflow-hidden bg-gray-50 bg-opacity-50" v-if="selectedItemKey">
            <!-- Config Content (Resizable) -->
            <div class="view-config flex flex-col overflow-y-auto bg-white border-r border-gray-200"
                :style="{ width: configPanelWidth + 'px' }">

                <!-- View Configuration Mode -->
                <ViewConfigPanel v-if="configMode === 'view' && selectedView" :view="selectedView" :fields="fields"
                    :actions="availableActions" @update:viewProp="handleViewUpdate"
                    @update:deckConfig="handleDeckUpdate" @update:mapConfig="handleMapUpdate"
                    @toggle-action="handleActionToggle" @delete-view="handleDeleteView" />

                <!-- Navigation Configuration Mode -->
                <NavigationConfigPanel v-else-if="configMode === 'nav' && selectedNav" :nav-item="selectedNav"
                    :available-views="localLayout.views" @update:nav="handleNavUpdate" @delete-nav="handleDeleteNav" />
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
import { useNavigationManagement } from '../../composables/useNavigationManagement';
import { useTableEditor } from '../../composables/useTableEditor';
import { useViewConfigSync } from '../../composables/useViewConfigSync';
import { useViewManagement } from '../../composables/useViewManagement';

// Sub-components
import type { ViewDefinition } from '../../types/editor.types';
import ResizableDivider from '../shared/ResizableDivider.vue';
import NavigationConfigPanel from './config/NavigationConfigPanel.vue';
import ViewConfigPanel from './config/ViewConfigPanel.vue';
import ViewsSidebar from './sidebar/ViewsSidebar.vue';

// ============================================================================
// 1. Core State & Sync
// ============================================================================

const { state, fields, updateLayout } = useTableEditor();

// Sync local layout state with global store
const { localLayout, commitLocalChanges } = useViewConfigSync(
    () => state.layout,
    (updates) => updateLayout(updates) // callback to save to global store
);

// ============================================================================
// 2. Logic Composables
// ============================================================================

// View Management (CRUD types, etc)
const {
    selectedViewKey,
    selectedView,
    selectView: _selectView,
    createView,
    deleteView: _deleteView,
    updateViewProp,
    updateDeckConfigProp,
    updateMapConfigProp,
    toggleAction
} = useViewManagement(localLayout, commitLocalChanges);

// Navigation Management (Tab bar)
const {
    navigation,
    selectedNavKey,
    selectedNav,
    fetchNavigation,
    createNavItem,
    deleteNavItem: _deleteNavItem,
    selectNavItem: _selectNavItem,
    updateNavItem,
    onNavSort
} = useNavigationManagement(() => state.appId);

// ============================================================================
// 3. Orchestration
// ============================================================================

const configMode = ref<'view' | 'nav'>('view');

// Sidebar width state for resizable panel
const sidebarWidth = ref(280);
const sidebarBaseWidth = ref(280);

// Config panel width state
const configPanelWidth = ref(700);
const configPanelBaseWidth = ref(100);

const selectedItemKey = computed(() => {
    return configMode.value === 'view' ? selectedViewKey.value : selectedNavKey.value;
});

const availableActions = computed(() => {
    return state.settings.actions.row || [];
});

// Mode Switching & Selection Handlers
function selectView(key: string) {
    configMode.value = 'view';
    // Clear nav selection to avoid confusion? No need handled by configMode
    _selectView(key);
}

function selectNavItem(id: string) {
    configMode.value = 'nav';
    _selectNavItem(id);
}

// Update Handlers (Bridge Component Events -> Composable Methods)

function handleViewUpdate(key: string, value: any) {
    if (selectedViewKey.value) {
        updateViewProp(selectedViewKey.value, key as keyof ViewDefinition, value);
    }
}

function handleDeckUpdate(key: string, value: any) {
    if (selectedViewKey.value) {
        updateDeckConfigProp(selectedViewKey.value, key, value);
    }
}

function handleMapUpdate(key: string, value: any) {
    if (selectedViewKey.value) {
        updateMapConfigProp(selectedViewKey.value, key, value);
    }
}

function handleActionToggle(actionId: string) {
    if (selectedViewKey.value) {
        toggleAction(selectedViewKey.value, actionId);
    }
}

function handleDeleteView() {
    if (selectedViewKey.value) {
        _deleteView(selectedViewKey.value);
    }
}

function handleNavUpdate(updates: any) {
    if (selectedNavKey.value) {
        updateNavItem(selectedNavKey.value, updates);
    }
}

function handleDeleteNav() {
    if (selectedNavKey.value) {
        _deleteNavItem(selectedNavKey.value);
    }
}

// Lifecycle
onMounted(() => {
    fetchNavigation();

    // Auto-select first view if nothing selected
    if (!selectedViewKey.value && localLayout.views) {
        const firstKey = Object.keys(localLayout.views)[0];
        if (firstKey) {
            selectView(firstKey);
        }
    }
});

// Watchers to keep mode in sync if programmatic changes occur
watch(selectedViewKey, (newVal) => {
    if (newVal) configMode.value = 'view';
});

watch(selectedNavKey, (newVal) => {
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
