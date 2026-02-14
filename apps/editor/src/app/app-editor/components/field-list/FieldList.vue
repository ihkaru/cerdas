<template>
    <div class="field-list">
        <!-- Breadcrumbs -->
        <div v-if="breadcrumbs && breadcrumbs.length > 1" class="breadcrumbs">
            <f7-link icon-f7="arrow_left" class="back-link" @click="emit('drill-up')" />
            <div class="crumb-list">
                <span v-for="(crumb, index) in breadcrumbs" :key="index" class="crumb">
                    <span v-if="index > 0" class="separator">/</span>
                    <span class="crumb-label" :class="{ active: index === breadcrumbs.length - 1 }"
                        @click="index < breadcrumbs.length - 1 ? emit('drill-to', crumb.path) : null">
                        {{ crumb.label }}
                    </span>
                </span>
            </div>
        </div>

        <!-- Header -->
        <div class="field-list-header">
            <h3 class="header-title">{{ breadcrumbs && breadcrumbs.length > 1 ? breadcrumbs[breadcrumbs.length -
                1]!.label : 'Fields' }}</h3>
            <f7-button small fill round icon-f7="plus" @click="showAddFieldSheet = true">
                Add Field
            </f7-button>
        </div>

        <!-- Empty State -->
        <div v-if="fields.length === 0" class="empty-state">
            <f7-icon f7="doc_text" class="empty-icon" />
            <p class="empty-text">No fields yet</p>
            <p class="empty-hint">Click "Add Field" to start building your form</p>
        </div>

        <!-- Field List with Drag & Drop -->
        <div v-else class="field-list-content">
            <draggable v-model="localFields" item-key="_editorId" handle=".drag-handle" ghost-class="ghost"
                animation="200">
                <template #item="{ element, index }">
                    <FieldListItem :field="element" :selected="selectedPath === String(index)" :depth="0"
                        @select="emit('select', String(index))" @delete="handleDelete(index)"
                        @duplicate="emit('duplicate', String(index))" @drill-in="emit('drill-in', index)" />
                </template>
            </draggable>
        </div>

        <!-- Add Field Action Sheet -->
        <f7-actions :opened="showAddFieldSheet" @actions:closed="showAddFieldSheet = false">
            <f7-actions-group>
                <f7-actions-label>Add Field</f7-actions-label>

                <!-- Basic Fields -->
                <f7-actions-button v-for="type in basicTypes" :key="type.type" @click="handleAddField(type.type)">
                    <f7-icon slot="media" :f7="type.icon" />
                    {{ type.label }}
                </f7-actions-button>
            </f7-actions-group>

            <f7-actions-group>
                <f7-actions-label>Choice Fields</f7-actions-label>
                <f7-actions-button v-for="type in choiceTypes" :key="type.type" @click="handleAddField(type.type)">
                    <f7-icon slot="media" :f7="type.icon" />
                    {{ type.label }}
                </f7-actions-button>
            </f7-actions-group>

            <f7-actions-group>
                <f7-actions-label>Media Fields</f7-actions-label>
                <f7-actions-button v-for="type in mediaTypes" :key="type.type" @click="handleAddField(type.type)">
                    <f7-icon slot="media" :f7="type.icon" />
                    {{ type.label }}
                </f7-actions-button>
            </f7-actions-group>

            <f7-actions-group>
                <f7-actions-label>Advanced</f7-actions-label>
                <f7-actions-button v-for="type in advancedTypes" :key="type.type" @click="handleAddField(type.type)">
                    <f7-icon slot="media" :f7="type.icon" />
                    {{ type.label }}
                </f7-actions-button>
            </f7-actions-group>

            <f7-actions-group>
                <f7-actions-button color="red">Cancel</f7-actions-button>
            </f7-actions-group>
        </f7-actions>

        <!-- Delete confirmation is now handled via f7.dialog.confirm in script -->
    </div>
</template>

<script setup lang="ts">
import { f7 } from 'framework7-vue';
import { computed, ref } from 'vue';
import draggable from 'vuedraggable';
import {
    FIELD_TYPE_META,
    type EditableFieldDefinition,
    type FieldType
} from '../../types/editor.types';
import FieldListItem from './FieldListItem.vue';

// ============================================================================
// Props & Emits
// ============================================================================

interface Props {
    fields: EditableFieldDefinition[];
    selectedPath: string | null;
    breadcrumbs?: { label: string; path: any[] }[];
}

const props = defineProps<Props>();

const emit = defineEmits<{
    select: [path: string];
    add: [type: FieldType, afterIndex?: number];
    delete: [path: string];
    duplicate: [path: string];
    reorder: [newFields: EditableFieldDefinition[]];
    'drill-in': [index: number];
    'drill-up': [];
    'drill-to': [path: any[]];
}>();

// ============================================================================
// State
// ============================================================================

const showAddFieldSheet = ref(false);

// Local copy of fields for draggable v-model
const localFields = computed({
    get: () => props.fields,
    set: (newFields) => emit('reorder', newFields)
});

// ============================================================================
// Computed
// ============================================================================

// Group field types by category
const allTypes = Object.values(FIELD_TYPE_META);
const basicTypes = computed(() => allTypes.filter(t => t.category === 'basic'));
const choiceTypes = computed(() => allTypes.filter(t => t.category === 'choice'));
const mediaTypes = computed(() => allTypes.filter(t => t.category === 'media'));
const advancedTypes = computed(() => allTypes.filter(t => t.category === 'advanced'));

// ============================================================================
// Handlers
// ============================================================================

function handleAddField(type: FieldType) {
    showAddFieldSheet.value = false;
    emit('add', type);
}

function handleDelete(index: number) {
    const field = props.fields[index];
    const fieldName = field?.label || field?.name || 'this field';

    f7.dialog.confirm(
        `Are you sure you want to delete "${fieldName}"?`,
        'Delete Field',
        () => {
            // Confirmed
            emit('delete', String(index));
        }
    );
}
</script>

<style scoped>
.field-list {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: var(--f7-page-bg-color);
}

/* Header */
.field-list-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px;
    border-bottom: 1px solid var(--f7-list-border-color);
    background: var(--f7-bars-bg-color);
    position: sticky;
    top: 0;
    z-index: 10;
}

.header-title {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
}

/* Empty State */
.empty-state {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px;
    text-align: center;
}

.empty-icon {
    font-size: 64px;
    color: var(--f7-list-item-subtitle-text-color);
    opacity: 0.3;
    margin-bottom: 16px;
}

.empty-text {
    font-size: 18px;
    font-weight: 500;
    color: var(--f7-list-item-title-text-color);
    margin: 0 0 8px 0;
}

.empty-hint {
    font-size: 14px;
    color: var(--f7-list-item-subtitle-text-color);
    margin: 0;
}

/* Field List Content */
.field-list-content {
    flex: 1;
    overflow-y: auto;
}

/* Transition */
.field-list-enter-active,
.field-list-leave-active {
    transition: all 0.3s ease;
}

.field-list-enter-from {
    opacity: 0;
    transform: translateX(-20px);
}

.field-list-leave-to {
    opacity: 0;
    transform: translateX(20px);
}

.field-list-move {
    transition: transform 0.3s ease;
}

/* Action Sheet Styling */
:deep(.actions-button) {
    justify-content: flex-start;
}

:deep(.actions-button .icon) {
    margin-right: 12px;
    font-size: 20px;
}

/* Drag and Drop Ghost */
.ghost {
    opacity: 0.5;
    background: rgba(var(--f7-theme-color-rgb), 0.15) !important;
    border: 2px dashed var(--f7-theme-color) !important;
}

/* Breadcrumbs */
.breadcrumbs {
    display: flex;
    align-items: center;
    padding: 12px 16px;
    background: white;
    border-bottom: 1px solid var(--f7-list-border-color);
    gap: 8px;
}

.back-link {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--f7-list-item-title-text-color);
    border-radius: 50%;
}

.back-link:hover {
    background: rgba(0, 0, 0, 0.05);
}

.crumb-list {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    font-size: 14px;
}

.crumb {
    display: flex;
    align-items: center;
}

.separator {
    margin: 0 6px;
    color: #94a3b8;
}

.crumb-label {
    cursor: pointer;
    color: var(--f7-theme-color);
    font-weight: 500;
}

.crumb-label:hover {
    text-decoration: underline;
}

.crumb-label.active {
    color: var(--f7-list-item-title-text-color);
    cursor: default;
    text-decoration: none;
    font-weight: 600;
}
</style>
