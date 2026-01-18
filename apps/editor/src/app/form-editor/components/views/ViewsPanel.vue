<template>
    <div class="views-panel">
        <f7-block-title>Global Settings</f7-block-title>
        <f7-list inset strong>
            <f7-list-input label="App Name" type="text" :value="layout.app_name" placeholder="Enter app name"
                @input="updateLayoutProp('app_name', ($event.target as HTMLInputElement).value)" />
            <f7-list-item title="Layout Type">
                <f7-segmented slot="after" strong>
                    <f7-button :active="layout.type === 'standard'" @click="updateLayoutProp('type', 'standard')">
                        Standard
                    </f7-button>
                    <f7-button :active="layout.type === 'custom'" @click="updateLayoutProp('type', 'custom')">
                        Custom
                    </f7-button>
                </f7-segmented>
            </f7-list-item>
        </f7-list>

        <f7-block-title>Group By (Drill-down Navigation)</f7-block-title>
        <f7-list inset strong>
            <f7-list-item v-for="(_, index) in groupByFields" :key="index">
                <template #title>
                    <span class="group-level">Level {{ index + 1 }}</span>
                </template>
                <template #after>
                    <FieldPicker :model-value="groupByFields[index] ?? null" :fields="fields" :allow-none="true"
                        placeholder="Select field..." @update:model-value="updateGroupBy(index, $event)" />
                </template>
                <template #content-end>
                    <f7-link v-if="groupByFields.length > 1" icon-f7="trash" color="red"
                        @click="removeGroupByLevel(index)" />
                </template>
            </f7-list-item>
            <f7-list-button @click="addGroupByLevel">
                <f7-icon f7="plus" />
                Add Level
            </f7-list-button>
        </f7-list>

        <f7-block-title>Default View Settings</f7-block-title>
        <f7-list inset strong>
            <f7-list-item title="View Type" smart-select :smart-select-params="{ openIn: 'popover' }">
                <select name="viewType" :value="defaultView.type" @change="updateViewType">
                    <option value="deck">Deck View</option>
                    <option value="table">Table View</option>
                    <option value="map">Map View</option>
                    <option value="calendar">Calendar View</option>
                </select>
            </f7-list-item>
            <f7-list-input label="View Title" type="text" :value="defaultView.title" placeholder="e.g., Assignments"
                @input="updateDefaultViewProp('title', ($event.target as HTMLInputElement).value)" />
        </f7-list>

        <!-- Deck View Specific Settings -->
        <template v-if="defaultView.type === 'deck'">
            <f7-block-title>Deck View Configuration</f7-block-title>
            <f7-list inset strong>
                <f7-list-item>
                    <template #title>Primary Header Field</template>
                    <template #after>
                        <FieldPicker v-model="deckConfig.primaryHeaderField" :fields="fields" :allow-none="false"
                            placeholder="Select field..."
                            @update:model-value="updateDeckConfigProp('primaryHeaderField', $event)" />
                    </template>
                </f7-list-item>
                <f7-list-item>
                    <template #title>Secondary Header Field</template>
                    <template #after>
                        <FieldPicker v-model="deckConfig.secondaryHeaderField" :fields="fields" :allow-none="true"
                            placeholder="Select field..."
                            @update:model-value="updateDeckConfigProp('secondaryHeaderField', $event)" />
                    </template>
                </f7-list-item>
                <f7-list-item>
                    <template #title>Image Field</template>
                    <template #after>
                        <FieldPicker v-model="deckConfig.imageField" :fields="fields" :allow-none="true"
                            :filter-types="['image']" placeholder="None"
                            @update:model-value="updateDeckConfigProp('imageField', $event)" />
                    </template>
                </f7-list-item>
                <f7-list-item title="Image Shape">
                    <f7-segmented slot="after" strong>
                        <f7-button :active="deckConfig.imageShape === 'square'"
                            @click="updateDeckConfigProp('imageShape', 'square')">
                            Square
                        </f7-button>
                        <f7-button :active="deckConfig.imageShape === 'circle'"
                            @click="updateDeckConfigProp('imageShape', 'circle')">
                            Circle
                        </f7-button>
                    </f7-segmented>
                </f7-list-item>
            </f7-list>
        </template>

        <f7-block-title>View Actions</f7-block-title>
        <f7-list inset strong>
            <f7-list-item v-for="action in availableActions" :key="action.id" :title="action.label" checkbox
                :checked="selectedActions.includes(action.id)" @change="toggleAction(action.id)">
                <f7-icon slot="media" :f7="action.icon" />
            </f7-list-item>
        </f7-list>
    </div>
</template>

<script setup lang="ts">
import { computed, reactive, toRaw, watch } from 'vue';
import { useSchemaEditor } from '../../composables/useSchemaEditor';
import type { LayoutConfig, ViewDefinition } from '../../types/editor.types';
import FieldPicker from '../shared/FieldPicker.vue';

// ============================================================================
// State from Composable
// ============================================================================

const { state, fields, updateLayout } = useSchemaEditor();

// Local state for reactivity (synced with global state)
const layout = reactive<LayoutConfig>({
    type: 'standard',
    app_name: 'Untitled App',
    groupBy: [],
    views: {
        default: {
            type: 'deck',
            title: 'Assignments',
            groupBy: [],
            deck: {
                primaryHeaderField: 'name',
                secondaryHeaderField: 'description',
                imageField: null,
                imageShape: 'square',
            },
            actions: ['open', 'delete'],
        },
    },
});

// Sync local state with global store
watch(
    () => state.layout,
    (newLayout) => {
        if (newLayout) {
            Object.assign(layout, toRaw(newLayout));
        }
    },
    { immediate: true, deep: true }
);

// ============================================================================
// Computed
// ============================================================================

const defaultView = computed(() => layout.views?.default || {
    type: 'deck',
    title: 'Assignments',
    groupBy: [],
    deck: {
        primaryHeaderField: 'name',
        secondaryHeaderField: 'description',
        imageField: null,
        imageShape: 'square',
    },
    actions: [],
} as ViewDefinition);

const deckConfig = computed(() => defaultView.value.deck || {
    primaryHeaderField: 'name',
    secondaryHeaderField: 'description',
    imageField: null,
    imageShape: 'square',
});

const groupByFields = computed({
    get: () => {
        const gb = layout.groupBy || [];
        // Always show at least one slot
        return gb.length > 0 ? gb : [''];
    },
    set: (value: string[]) => {
        layout.groupBy = value.filter(Boolean);
        updateLayout({ groupBy: layout.groupBy });
    },
});

const selectedActions = computed({
    get: () => defaultView.value.actions || [],
    set: (value: string[]) => {
        updateDefaultViewProp('actions', value);
    },
});

// Mock available actions - TODO: Get from settings
const availableActions = [
    { id: 'open', label: 'Open', icon: 'doc_text' },
    { id: 'delete', label: 'Delete', icon: 'trash' },
    { id: 'complete', label: 'Mark Complete', icon: 'checkmark_circle' },
    { id: 'edit', label: 'Edit', icon: 'pencil' },
];

// ============================================================================
// Methods
// ============================================================================

function updateLayoutProp<K extends keyof LayoutConfig>(key: K, value: LayoutConfig[K]) {
    layout[key] = value;
    updateLayout({ [key]: value });
}

function updateDefaultViewProp<K extends keyof ViewDefinition>(key: K, value: ViewDefinition[K]) {
    if (!layout.views) layout.views = {};
    if (!layout.views.default) {
        layout.views.default = {
            type: 'deck',
            title: 'Assignments',
            groupBy: [],
            actions: [],
        };
    }
    layout.views.default[key] = value;
    updateLayout({ views: { ...layout.views } });
}

function updateDeckConfigProp(key: string, value: unknown) {
    if (!layout.views?.default) return;
    if (!layout.views.default.deck) {
        layout.views.default.deck = {
            primaryHeaderField: 'name',
            secondaryHeaderField: 'description',
            imageField: null,
            imageShape: 'square',
        };
    }
    (layout.views.default.deck as Record<string, unknown>)[key] = value;
    updateLayout({ views: { ...layout.views } });
}

function updateViewType(event: Event) {
    const select = event.target as HTMLSelectElement;
    updateDefaultViewProp('type', select.value as ViewDefinition['type']);
}

function addGroupByLevel() {
    const newGroupBy = [...(layout.groupBy || []), ''];
    layout.groupBy = newGroupBy;
}

function removeGroupByLevel(index: number) {
    const newGroupBy = [...(layout.groupBy || [])];
    newGroupBy.splice(index, 1);
    layout.groupBy = newGroupBy;
    updateLayout({ groupBy: newGroupBy.filter(Boolean) });
}

function updateGroupBy(index: number, value: string | null) {
    const newGroupBy = [...(layout.groupBy || [])];
    if (value) {
        newGroupBy[index] = value;
    } else {
        newGroupBy.splice(index, 1);
    }
    layout.groupBy = newGroupBy;
    updateLayout({ groupBy: newGroupBy.filter(Boolean) });
}

function toggleAction(actionId: string) {
    const actions = [...(defaultView.value.actions || [])];
    const index = actions.indexOf(actionId);
    if (index === -1) {
        actions.push(actionId);
    } else {
        actions.splice(index, 1);
    }
    updateDefaultViewProp('actions', actions);
}
</script>

<style scoped>
.views-panel {
    padding-bottom: 24px;
}

.group-level {
    font-weight: 500;
    color: var(--f7-list-item-title-text-color);
}

/* Make field picker fit inside list item */
:deep(.field-picker) {
    min-width: 180px;
}

:deep(.picker-trigger) {
    padding: 6px 10px;
    font-size: 13px;
}
</style>
