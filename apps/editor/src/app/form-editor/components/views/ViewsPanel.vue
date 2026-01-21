<template>
    <div class="views-panel h-full flex flex-row">
        <!-- Sidebar: List of Views & Navigation -->
        <div class="views-sidebar w-1/3 border-r border-gray-200 flex flex-col bg-gray-50">
            <!-- Section: Views -->
            <f7-block-title class="!mt-4 !mb-2 flex justify-between items-center pr-4">
                <span>App Views</span>
                <f7-link icon-f7="plus" icon-size="18" @click="createNewView" />
            </f7-block-title>
            <f7-list class="flex-shrink-0 !my-0 border-b border-gray-200">
                <f7-list-item v-for="(view, key) in layout.views" :key="key" :title="view.title || key"
                    :subtitle="view.type" link="#"
                    :class="{ 'bg-blue-50': selectedItemKey === key && configMode === 'view' }"
                    @click="selectView(key)">
                    <template #media>
                        <f7-icon :f7="getViewIcon(view.type)" size="20" />
                    </template>
                </f7-list-item>
            </f7-list>

            <!-- Section: Navigation -->
            <f7-block-title class="!mt-4 !mb-2 flex justify-between items-center pr-4">
                <span>Bottom Navigation</span>
                <f7-link icon-f7="plus" icon-size="18" @click="createNavItem" />
            </f7-block-title>
            <f7-list sortable @sortable:sort="onNavSort" class="flex-1 overflow-y-auto !my-0">
                <f7-list-item v-for="(item, index) in navigation" :key="item.id || index" :title="item.label"
                    :subtitle="item.type" link="#"
                    :class="{ 'bg-blue-50': selectedItemKey === item.id && configMode === 'nav' }"
                    @click="selectNavItem(item)">
                    <template #media>
                        <f7-icon :f7="item.icon" size="20" />
                    </template>
                </f7-list-item>
            </f7-list>
        </div>

        <!-- Main Content: Configuration -->
        <div class="view-config flex-1 overflow-y-auto p-4 bg-white" v-if="selectedItemKey">
            <!-- header -->
            <div class="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
                <h2 class="text-xl font-semibold m-0 flex items-center gap-2">
                    <f7-icon :f7="configMode === 'view' ? 'rectangle_stack' : 'list_bullet_rectangle'" size="24"
                        class="text-blue-500" />
                    {{ configMode === 'view' ? 'Configure View' : 'Configure Tab' }}
                </h2>
                <f7-button small color="red" outline
                    @click="configMode === 'view' ? deleteView(selectedItemKey) : deleteNavItem(selectedItemKey)">
                    Delete {{ configMode === 'view' ? 'View' : 'Item' }}
                </f7-button>
            </div>

            <!-- MODE: VIEW CONFIGURATION -->
            <div v-if="configMode === 'view' && selectedView">
                <f7-list inset strong class="!mt-0">
                    <!-- View Type Selector -->
                    <f7-list-item title="View Type" smart-select :smart-select-params="{ openIn: 'popover' }">
                        <select :value="selectedView.type" @change="updateSelectedViewProp('type', $event)">
                            <option value="deck">Deck View (Cards)</option>
                            <option value="table">Table View (List)</option>
                            <option value="map">Map View</option>
                            <option value="calendar">Calendar View</option>
                        </select>
                        <f7-icon slot="media" :f7="getViewIcon(selectedView.type)" />
                    </f7-list-item>

                    <!-- View Title -->
                    <f7-list-input label="View Title" type="text" :value="selectedView.title"
                        @input="updateSelectedViewProp('title', ($event.target as HTMLInputElement).value)">
                        <f7-icon slot="media" f7="textformat" />
                    </f7-list-input>

                    <!-- Sort By -->
                    <f7-list-item title="Sort By">
                        <template #media>
                            <f7-icon f7="arrow_up_arrow_down" />
                        </template>
                        <template #after>
                            <FieldPicker :model-value="selectedView.sortBy ?? null" :fields="fields" :allow-none="true"
                                placeholder="Default Order"
                                @update:model-value="updateSelectedViewProp('sortBy', $event ?? undefined)" />
                        </template>
                    </f7-list-item>

                    <f7-list-item title="Sort Order" v-if="selectedView.sortBy">
                        <f7-segmented slot="after" strong style="min-width: 120px">
                            <f7-button :active="!selectedView.sortOrder || selectedView.sortOrder === 'asc'"
                                @click="updateSelectedViewProp('sortOrder', 'asc')">Asc</f7-button>
                            <f7-button :active="selectedView.sortOrder === 'desc'"
                                @click="updateSelectedViewProp('sortOrder', 'desc')">Desc</f7-button>
                        </f7-segmented>
                    </f7-list-item>

                    <!-- Slice Filter -->
                    <f7-list-input label="Slice Filter (Values)" type="text" :value="selectedView.slice_filter"
                        placeholder="e.g. status == 'pending'" info="Javascript expression to filter rows"
                        @input="updateSelectedViewProp('slice_filter', ($event.target as HTMLInputElement).value)">
                        <f7-icon slot="media" f7="funnel" />
                    </f7-list-input>
                </f7-list>

                <!-- Deck View Specific -->
                <template v-if="selectedView.type === 'deck'">
                    <f7-block-title>Deck Card Layout</f7-block-title>
                    <f7-list inset strong>
                        <f7-list-item>
                            <template #title>Primary Header</template>
                            <template #after>
                                <FieldPicker :model-value="selectedView.deck?.primaryHeaderField ?? null"
                                    :fields="fields" :allow-none="false" placeholder="Select field..."
                                    @update:model-value="updateDeckConfigProp('primaryHeaderField', $event)" />
                            </template>
                        </f7-list-item>
                        <f7-list-item>
                            <template #title>Secondary Header</template>
                            <template #after>
                                <FieldPicker :model-value="selectedView.deck?.secondaryHeaderField ?? null"
                                    :fields="fields" :allow-none="true" placeholder="Select field..."
                                    @update:model-value="updateDeckConfigProp('secondaryHeaderField', $event)" />
                            </template>
                        </f7-list-item>
                        <f7-list-item>
                            <template #title>Image Field</template>
                            <template #after>
                                <FieldPicker :model-value="selectedView.deck?.imageField ?? null" :fields="fields"
                                    :allow-none="true" :filter-types="['image']" placeholder="None"
                                    @update:model-value="updateDeckConfigProp('imageField', $event)" />
                            </template>
                        </f7-list-item>
                        <f7-list-item title="Image Shape">
                            <f7-segmented slot="after" strong>
                                <f7-button :active="selectedView.deck?.imageShape === 'square'"
                                    @click="updateDeckConfigProp('imageShape', 'square')">Square</f7-button>
                                <f7-button :active="selectedView.deck?.imageShape === 'circle'"
                                    @click="updateDeckConfigProp('imageShape', 'circle')">Circle</f7-button>
                            </f7-segmented>
                        </f7-list-item>
                    </f7-list>
                </template>

                <!-- Map View Specific -->
                <template v-if="selectedView.type === 'map'">
                    <f7-block-title>Map Configuration</f7-block-title>
                    <f7-list inset strong>
                        <f7-list-item>
                            <template #title>Latitude Field</template>
                            <template #after>
                                <FieldPicker :model-value="selectedView.map?.lat ?? null" :fields="fields"
                                    :allow-none="false" :filter-types="['gps']" placeholder="Select GPS field..."
                                    @update:model-value="updateMapConfigProp('lat', $event)" />
                            </template>
                        </f7-list-item>
                        <f7-list-item>
                            <template #title>Longitude Field</template>
                            <template #after>
                                <FieldPicker :model-value="selectedView.map?.long ?? null" :fields="fields"
                                    :allow-none="false" :filter-types="['gps']" placeholder="Select GPS field..."
                                    @update:model-value="updateMapConfigProp('long', $event)" />
                            </template>
                        </f7-list-item>
                        <f7-list-item>
                            <template #title>Label Field</template>
                            <template #after>
                                <FieldPicker :model-value="selectedView.map?.label ?? null" :fields="fields"
                                    :allow-none="true" placeholder="Field for pin label..."
                                    @update:model-value="updateMapConfigProp('label', $event)" />
                            </template>
                        </f7-list-item>
                    </f7-list>
                </template>

                <!-- Actions Configuration -->
                <f7-block-title>View Actions</f7-block-title>
                <f7-list inset strong>
                    <f7-list-item v-for="action in availableActions" :key="action.id" :title="action.label" checkbox
                        :checked="selectedView.actions?.includes(action.id)" @change="toggleAction(action.id)">
                        <f7-icon slot="media" :f7="action.icon" />
                        <template #footer>
                            <div class="text-xs text-gray-500">{{ action.type }}</div>
                        </template>
                    </f7-list-item>
                    <f7-list-item v-if="availableActions.length === 0" title="No actions defined in settings" />
                </f7-list>
            </div>

            <!-- MODE: NAV CONFIGURATION -->
            <div v-else-if="configMode === 'nav' && selectedNav">
                <f7-list inset strong class="!mt-0">
                    <f7-list-input label="Label" type="text" :value="selectedNav.label" placeholder="Tab Name"
                        @input="updateNavProp('label', ($event.target as HTMLInputElement).value)">
                        <f7-icon slot="media" f7="tag" />
                    </f7-list-input>

                    <f7-list-item title="Icon" smart-select
                        :smart-select-params="{ openIn: 'popup', searchbar: true, searchbarPlaceholder: 'Search icons' }">
                        <select :value="selectedNav.icon" @change="updateNavProp('icon', $event)">
                            <option value="square">Square</option>
                            <option value="house">House</option>
                            <option value="list_bullet">List</option>
                            <option value="map">Map</option>
                            <option value="calendar">Calendar</option>
                            <option value="person">Person</option>
                            <option value="gear">Settings</option>
                            <option value="globe">Globe (Web)</option>
                            <option value="doc_text">Document</option>
                            <option value="chart_bar">Chart</option>
                        </select>
                        <f7-icon slot="media" :f7="selectedNav.icon" />
                    </f7-list-item>

                    <f7-list-item title="Type" smart-select :smart-select-params="{ openIn: 'popover' }">
                        <select :value="selectedNav.type" @change="updateNavProp('type', $event)">
                            <option value="view">App View</option>
                            <option value="link">External Link</option>
                        </select>
                        <f7-icon slot="media" f7="arrow_branch" />
                    </f7-list-item>

                    <f7-list-item v-if="selectedNav.type === 'view'" title="Target View" smart-select
                        :smart-select-params="{ openIn: 'popup' }">
                        <select :value="selectedNav.view_id" @change="updateNavProp('view_id', $event)">
                            <option value="" disabled>Select a view...</option>
                            <option v-for="(view, k) in layout.views" :key="k" :value="k">
                                {{ view.title || k }} ({{ view.type }})
                            </option>
                        </select>
                        <f7-icon slot="media" f7="rectangle_stack" />
                    </f7-list-item>

                    <f7-list-input v-if="selectedNav.type === 'link'" label="URL" type="url" placeholder="https://..."
                        :value="selectedNav.url"
                        @input="updateNavProp('url', ($event.target as HTMLInputElement).value)">
                        <f7-icon slot="media" f7="link" />
                    </f7-list-input>
                </f7-list>

                <f7-block-footer class="p-4">
                    Changes to navigation affect the main tab bar of the application.
                </f7-block-footer>
            </div>
        </div>

        <div v-else class="flex-1 flex items-center justify-center text-gray-400 bg-gray-50">
            <div class="text-center">
                <f7-icon f7="rectangle_split_3x1" size="48" class="mb-4 text-gray-300" />
                <p>Select a view or navigation item to configure</p>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ApiClient } from '@/common/api/ApiClient';
import { f7 } from 'framework7-vue';
import { computed, onMounted, reactive, ref, toRaw, watch } from 'vue';
import { useSchemaEditor } from '../../composables/useSchemaEditor';
import type { LayoutConfig, ViewDefinition } from '../../types/editor.types';
import FieldPicker from '../shared/FieldPicker.vue';

// ============================================================================
// State
// ============================================================================

const { state, fields, updateLayout } = useSchemaEditor();

// Local layout copy
const layout = reactive<LayoutConfig>({
    type: 'standard',
    app_name: 'Untitled App',
    groupBy: [],
    views: {},
});

// Config Switcher
const configMode = ref<'view' | 'nav'>('view');
const selectedItemKey = ref<string>('');

// Navigation State
const navigation = ref<any[]>([]);
const isNavDirty = ref(false);

// ============================================================================
// Sync Layout
// ============================================================================

watch(() => state.layout, (newLayout) => {
    if (newLayout) {
        Object.assign(layout, toRaw(newLayout));

        // Ensure default view exists if empty
        if (!layout.views || Object.keys(layout.views).length === 0) {
            layout.views = {
                default: createDefaultView('Assignments')
            };
        }

        // Initial Selection if nothing selected
        if (!selectedItemKey.value) {
            configMode.value = 'view';
            selectedItemKey.value = Object.keys(layout.views)[0] || 'default';
        }
    }
}, { immediate: true, deep: true });

// ============================================================================
// Computed
// ============================================================================

const selectedView = computed(() => {
    if (configMode.value !== 'view') return null;
    return layout.views[selectedItemKey.value];
});

const selectedNav = computed(() => {
    if (configMode.value !== 'nav') return null;
    return navigation.value.find(n => n.id === selectedItemKey.value);
});

const availableActions = computed(() => {
    return state.settings.actions.row || [];
});

// ============================================================================
// Helper Methods
// ============================================================================

function getViewIcon(type: string) {
    switch (type) {
        case 'map': return 'map';
        case 'deck': return 'rectangle_stack';
        case 'table': return 'table';
        case 'calendar': return 'calendar';
        default: return 'square_grid_2x2';
    }
}

function createDefaultView(title: string): ViewDefinition {
    return {
        type: 'deck',
        title,
        groupBy: [],
        deck: {
            primaryHeaderField: 'name',
            secondaryHeaderField: 'description',
            imageField: null,
            imageShape: 'square',
        },
        actions: ['open', 'delete'],
    };
}

// ============================================================================
// VIEW Methods
// ============================================================================

function selectView(key: any) {
    configMode.value = 'view';
    selectedItemKey.value = String(key);
}

function createNewView() {
    f7.dialog.prompt('Enter view name (ID will be generated)', (title) => {
        if (!title) return;
        const id = title.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Math.floor(Math.random() * 1000);

        const newView = createDefaultView(title);
        layout.views[id] = newView;
        updateLayout({ views: { ...layout.views } });

        selectView(id);
    });
}

function deleteView(key: string) {
    const view = layout.views[key];
    if (!view) return;

    f7.dialog.confirm(`Delete view "${view.title}"?`, () => {
        delete layout.views[key];
        updateLayout({ views: { ...layout.views } });
        // Select next available
        selectedItemKey.value = Object.keys(layout.views)[0] || '';
    });
}

function updateSelectedViewProp<K extends keyof ViewDefinition>(key: K, value: any) {
    if (!layout.views[selectedItemKey.value]) return;
    const finalValue = (value instanceof Event) ? (value.target as HTMLSelectElement).value : value;
    (layout.views[selectedItemKey.value] as any)[key] = finalValue;
    updateLayout({ views: { ...layout.views } });
}

function updateDeckConfigProp(key: string, value: any) {
    const view = layout.views[selectedItemKey.value];
    if (!view) return;
    if (!view.deck) view.deck = { primaryHeaderField: '', secondaryHeaderField: '', imageField: null, imageShape: 'square' };
    (view.deck as any)[key] = value;
    updateLayout({ views: { ...layout.views } });
}

function updateMapConfigProp(key: string, value: any) {
    const view = layout.views[selectedItemKey.value];
    if (!view) return;
    if (!view.map) view.map = { mapbox_style: 'satellite', lat: '', long: '', label: '' };
    (view.map as any)[key] = value;
    updateLayout({ views: { ...layout.views } });
}

function toggleAction(actionId: string) {
    const view = layout.views[selectedItemKey.value];
    if (!view) return;
    const actions = new Set(view.actions || []);
    if (actions.has(actionId)) actions.delete(actionId);
    else actions.add(actionId);
    view.actions = Array.from(actions);
    updateLayout({ views: { ...layout.views } });
}

// ============================================================================
// NAVIGATION Methods
// ============================================================================

const appId = computed(() => (state as any).appId);

async function fetchNavigation() {
    if (!appId.value) return;
    try {
        const res = await ApiClient.get(`/apps/${appId.value}`);
        navigation.value = res.data.data.navigation || [];
    } catch (e) {
        console.error('Failed to fetch navigation', e);
    }
}

async function saveNavigation() {
    if (!appId.value) return;
    try {
        await ApiClient.put(`/apps/${appId.value}`, {
            navigation: navigation.value
        });
        isNavDirty.value = false;
        f7.toast.show({ text: 'Navigation updated', position: 'center', closeTimeout: 1500 });
    } catch (e) {
        console.error('Failed to save navigation', e);
        f7.dialog.alert('Failed to save navigation changes');
    }
}

function selectNavItem(item: any) {
    configMode.value = 'nav';
    selectedItemKey.value = item.id;
}

function createNavItem() {
    f7.dialog.prompt('Enter label for new tab', (label) => {
        if (!label) return;

        const newItem = {
            id: String(Date.now()),
            type: 'view',
            label: label,
            icon: 'square',
            view_id: ''
        };

        navigation.value.push(newItem);
        selectNavItem(newItem);
        saveNavigation();
    });
}

function deleteNavItem(id: string) {
    f7.dialog.confirm('Delete this navigation item?', () => {
        navigation.value = navigation.value.filter(n => n.id !== id);
        if (selectedItemKey.value === id) {
            selectedItemKey.value = '';
        }
        saveNavigation();
    });
}

function onNavSort(event: any) {
    // F7 Sortable reorders DOM but we must handle array
    const { from, to } = event;
    if (from === to) return;

    const movedItem = navigation.value.splice(from, 1)[0];
    if (movedItem) {
        navigation.value.splice(to, 0, movedItem);
        saveNavigation();
    }
}

function updateNavProp(key: string, value: any) {
    const item = navigation.value.find(n => n.id === selectedItemKey.value);
    if (!item) return;

    // Handle specific logic (e.g. view vs link)
    const finalValue = (value instanceof Event) ? (value.target as HTMLSelectElement).value : value;
    (item as any)[key] = finalValue;

    // Auto-save debounce could be added, but for now specific updates trigger save? 
    // Or we rely on blur/change. Here we'll save simple updates.
    saveNavigation();
}

onMounted(() => {
    fetchNavigation();
});

</script>

<style scoped>
.views-sidebar {
    min-width: 250px;
    max-width: 320px;
}

/* Utility classes mirroring tailwind */
.h-full {
    height: 100%;
}

.w-1\/3 {
    width: 33.333%;
}

.flex {
    display: flex;
}

.flex-col {
    flex-direction: column;
}

.flex-row {
    flex-direction: row;
}

.flex-1 {
    flex: 1;
}

.border-r {
    border-right-width: 1px;
}

.border-b {
    border-bottom-width: 1px;
}

.border-gray-200 {
    border-color: #e5e7eb;
}

.bg-gray-50 {
    background-color: #f9fafb;
}

.bg-white {
    background-color: white;
}

.bg-blue-50 {
    background-color: #eff6ff;
}

.p-4 {
    padding: 1rem;
}

.mb-2 {
    margin-bottom: 0.5rem;
}

.mb-4 {
    margin-bottom: 1rem;
}

.mb-6 {
    margin-bottom: 1.5rem;
}

.mr-2 {
    margin-right: 0.5rem;
}

.pr-4 {
    padding-right: 1rem;
}

.pb-4 {
    padding-bottom: 1rem;
}

.text-xl {
    font-size: 1.25rem;
}

.text-xs {
    font-size: 0.75rem;
}

.font-semibold {
    font-weight: 600;
}

.text-gray-500 {
    color: #6b7280;
}

.text-gray-400 {
    color: #9ca3af;
}

.text-blue-500 {
    color: #3b82f6;
}

.item-center {
    align-items: center;
}

.justify-between {
    justify-content: space-between;
}

.items-center {
    align-items: center;
}

.gap-2 {
    gap: 0.5rem;
}

.overflow-y-auto {
    overflow-y: auto;
}
</style>
