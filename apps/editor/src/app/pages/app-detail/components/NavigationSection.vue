<template>
    <section class="navigation-section">
        <div class="section-header">
            <h2>App Navigation (Tab Bar)</h2>
            <p class="description">Configure the bottom tab items for your app.</p>
        </div>

        <div class="nav-editor">
            <f7-list sortable @sortable:sort="onSort" class="!my-0">
                <f7-list-item v-for="(item, index) in navigation" :key="item.id" :title="item.label" swipeout link="#"
                    @click="editItem(item)">
                    <template #media>
                        <f7-icon :f7="item.icon" />
                    </template>
                    <template #after>
                        <span class="badge">{{ item.type }}</span>
                    </template>
                    <f7-swipeout-actions right>
                        <f7-swipeout-button delete @click.stop="deleteItem(index)">Delete</f7-swipeout-button>
                    </f7-swipeout-actions>
                </f7-list-item>

                <f7-list-button title="Add Navigation Item" @click="startCreate">
                    <f7-icon f7="plus" />
                </f7-list-button>
            </f7-list>
        </div>

        <!-- Edit Popup -->
        <f7-popup v-model:opened="isPopupOpen" class="nav-edit-popup" push>
            <f7-page>
                <f7-navbar :title="editingItem.id ? 'Edit Item' : 'New Item'">
                    <f7-nav-right>
                        <f7-link popup-close>Cancel</f7-link>
                        <f7-link @click="saveItem" :disabled="!isValid">Save</f7-link>
                    </f7-nav-right>
                </f7-navbar>

                <f7-block-title>Item Configuration</f7-block-title>
                <f7-list inset strong>
                    <f7-list-input label="Label" type="text" placeholder="e.g. Home" :value="editingItem.label"
                        @input="editingItem.label = $event.target.value" clear-button required validate />

                    <f7-list-item title="Icon" smart-select
                        :smart-select-params="{ openIn: 'popup', searchbar: true, searchbarPlaceholder: 'Search icons' }">
                        <select v-model="editingItem.icon">
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
                        <f7-icon slot="media" :f7="editingItem.icon" />
                    </f7-list-item>

                    <f7-list-item title="Type" smart-select :smart-select-params="{ openIn: 'popover' }">
                        <select v-model="editingItem.type">
                            <option value="view">App View</option>
                            <option value="link">External Link</option>
                        </select>
                    </f7-list-item>

                    <!-- View Selector -->
                    <f7-list-item v-if="editingItem.type === 'view'" title="Target View" smart-select
                        :smart-select-params="{ openIn: 'popup' }">
                        <select v-model="editingItem.view_id">
                            <option value="" disabled>Select a view...</option>
                            <option v-for="view in views" :key="view.id" :value="view.id">
                                {{ view.name }} ({{ view.type }})
                            </option>
                        </select>
                    </f7-list-item>

                    <!-- Link URL -->
                    <f7-list-input v-if="editingItem.type === 'link'" label="URL" type="url" placeholder="https://..."
                        :value="editingItem.url" @input="editingItem.url = $event.target.value" clear-button required
                        validate />
                </f7-list>

                <f7-block-footer class="p-4">
                    <p>Navigation items appear in the bottom tab bar of your application.</p>
                </f7-block-footer>
            </f7-page>
        </f7-popup>
    </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { AppNavigationItem, AppView } from '../types/app-detail.types';

const props = defineProps<{
    navigation: AppNavigationItem[];
    views: AppView[];
    loading: boolean;
}>();

const emit = defineEmits<{
    (e: 'update', items: AppNavigationItem[]): void;
}>();

// ============================================================================
// State
// ============================================================================

const isPopupOpen = ref(false);
const editingIndex = ref<number>(-1);
const editingItem = ref<Partial<AppNavigationItem> & { url?: string }>({
    type: 'view',
    icon: 'square',
    label: '',
    view_id: ''
});

// ============================================================================
// Computed
// ============================================================================

const isValid = computed(() => {
    if (!editingItem.value.label) return false;
    if (editingItem.value.type === 'view' && !editingItem.value.view_id) return false;
    if (editingItem.value.type === 'link' && !editingItem.value.url) return false;
    return true;
});

// ============================================================================
// Methods
// ============================================================================

function startCreate() {
    editingIndex.value = -1;
    editingItem.value = {
        id: String(Date.now()),
        type: 'view',
        icon: 'square',
        label: '',
        view_id: ''
    };
    isPopupOpen.value = true;
}

function editItem(item: AppNavigationItem) {
    const idx = props.navigation.findIndex(n => n.id === item.id);
    editingIndex.value = idx;
    // Clone to avoid direct mutation
    editingItem.value = JSON.parse(JSON.stringify(item));
    // Ensure URL field exists if transforming from view to link
    if (!editingItem.value.url && (item as any).url) {
        editingItem.value.url = (item as any).url;
    }
    isPopupOpen.value = true;
}

function saveItem() {
    if (!isValid.value) return;

    const newNav = [...props.navigation];
    const itemToSave = { ...editingItem.value } as AppNavigationItem;

    if (editingIndex.value === -1) {
        // Create
        newNav.push(itemToSave);
    } else {
        // Update
        newNav[editingIndex.value] = itemToSave;
    }

    emit('update', newNav);
    isPopupOpen.value = false;
}

function deleteItem(index: number) {
    const newNav = [...props.navigation];
    newNav.splice(index, 1);
    emit('update', newNav);
}

function onSort(event: any) {
    // F7 Sortable reorders DOM, but we need to update state
    // Event.from and Event.to are indices
    const { from, to } = event;
    if (from === to) return;

    const newNav = [...props.navigation];
    const moved = newNav.splice(from, 1)[0] as AppNavigationItem;
    if (moved) {
        newNav.splice(to, 0, moved);
        emit('update', newNav);
    }
}
</script>

<style scoped>
.navigation-section {
    margin-bottom: 32px;
}

.section-header {
    margin-bottom: 24px;
}

.section-header h2 {
    font-size: 18px;
    font-weight: 600;
    color: #1e293b;
    margin: 0 0 4px 0;
}

.description {
    font-size: 14px;
    color: #64748b;
    margin: 0;
}

.nav-editor {
    background: white;
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid #e2e8f0;
}

.badge {
    padding: 4px 8px;
    background: #f1f5f9;
    color: #64748b;
    border-radius: 4px;
    font-size: 11px;
    text-transform: uppercase;
    font-weight: 600;
}
</style>
