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
            <button class="panel-primary-btn" @click="showAddFieldSheet = true">
                <f7-icon f7="plus" size="12" />
                Add Field
            </button>
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
    background: #ffffff;
}

/* Header — matches .panel-header token from app-editor.css */
.field-list-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 14px;
    height: 48px;
    box-sizing: border-box;
    border-bottom: 1px solid #e2e8f0;
    background: #ffffff;
    position: sticky;
    top: 0;
    z-index: 10;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.header-title {
    margin: 0;
    font-size: 13px;
    font-weight: 600;
    color: #1e293b;
    letter-spacing: 0.01em;
}

/* Shared primary button token (matches panel-primary-btn in EditorTabContent) */
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
    padding: 12px;
    box-sizing: border-box;
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
    border-bottom: 1px solid #e2e8f0;
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
