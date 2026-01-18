<template>
    <div class="field-list-item" :class="{
        'selected': selected,
        'dragging': isDragging,
        [`depth-${depth}`]: true
    }" @click="emit('select')">
        <!-- Drag Handle -->
        <div class="drag-handle">
            <f7-icon f7="line_horizontal_3" />
        </div>

        <!-- Field Type Icon -->
        <div class="field-icon" :style="{ color: typeColor }">
            <f7-icon :f7="fieldMeta.icon" />
        </div>

        <!-- Field Info -->
        <div class="field-info">
            <div class="field-label">
                {{ field.label || field.name }}
                <span v-if="field.required" class="required-badge">*</span>
            </div>
            <div class="field-meta">
                <span class="field-type">{{ fieldMeta.label }}</span>
                <span v-if="field.name" class="field-name">{{ field.name }}</span>
            </div>
        </div>

        <!-- Logic Indicators -->
        <div class="field-indicators">
            <f7-icon v-if="hasFormula" f7="function" class="indicator formula" title="Has formula" />
            <f7-icon v-if="hasLogic" f7="bolt" class="indicator logic" title="Has conditional logic" />
        </div>

        <!-- Actions -->
        <div class="field-actions" @click.stop>
            <f7-link icon-f7="doc_on_doc" class="action-btn" @click="emit('duplicate')" />
            <f7-link icon-f7="trash" class="action-btn delete" @click="emit('delete')" />
        </div>

        <!-- Nested Fields Indicator -->
        <div v-if="isNestedForm" class="nested-indicator" @click.stop="emit('drill-in')">
            <f7-button small round drill-in>
                <f7-icon f7="chevron_right" />
            </f7-button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { FIELD_TYPE_META, type EditableFieldDefinition, type FieldType } from '../../types/editor.types';

// ============================================================================
// Props & Emits
// ============================================================================

interface Props {
    field: EditableFieldDefinition;
    selected?: boolean;
    depth?: number;
    isDragging?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
    selected: false,
    depth: 0,
    isDragging: false,
});

const emit = defineEmits<{
    select: [];
    delete: [];
    duplicate: [];
    'drill-in': [];
}>();

// ============================================================================
// Computed
// ============================================================================

const fieldMeta = computed(() => {
    const type = props.field.type as FieldType;
    return FIELD_TYPE_META[type] || {
        type: 'text',
        label: 'Unknown',
        icon: 'questionmark_circle',
        category: 'basic',
    };
});

const typeColor = computed(() => {
    const categoryColors: Record<string, string> = {
        basic: '#2196f3',
        choice: '#9c27b0',
        media: '#ff9800',
        advanced: '#607d8b',
    };
    return categoryColors[fieldMeta.value.category] || '#757575';
});

const isNestedForm = computed(() => props.field.type === 'nested_form');

const hasFormula = computed(() => Boolean(props.field.formula_fn));

const hasLogic = computed(() =>
    Boolean(props.field.show_if_fn) ||
    Boolean(props.field.required_if_fn) ||
    Boolean(props.field.editable_if_fn)
);
</script>

<style scoped>
.field-list-item {
    display: flex;
    align-items: center;
    padding: 8px 12px;
    background: var(--f7-list-item-bg-color);
    border-bottom: 1px solid var(--f7-list-border-color);
    cursor: pointer;
    transition: background 0.15s;
    gap: 8px;
}

.field-list-item:hover {
    background: var(--f7-list-item-hover-bg-color, rgba(0, 0, 0, 0.03));
}

.field-list-item.selected {
    background: rgba(var(--f7-theme-color-rgb), 0.1);
    border-left: 3px solid var(--f7-theme-color);
    padding-left: 9px;
}

.field-list-item.dragging {
    opacity: 0.5;
}

/* Depth indentation */
.field-list-item.depth-1 {
    padding-left: 24px;
}

.field-list-item.depth-2 {
    padding-left: 36px;
}

.field-list-item.depth-3 {
    padding-left: 48px;
}

/* Drag Handle */
.drag-handle {
    cursor: grab;
    color: var(--f7-list-item-subtitle-text-color);
    opacity: 0.4;
    font-size: 14px;
}

.field-list-item:hover .drag-handle {
    opacity: 0.8;
}

/* Field Icon */
.field-icon {
    width: 26px;
    height: 26px;
    border-radius: 6px;
    background: rgba(var(--f7-theme-color-rgb), 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.field-icon :deep(.icon) {
    font-size: 14px;
}

/* Field Info */
.field-info {
    flex: 1;
    min-width: 0;
    overflow: hidden;
}

.field-label {
    font-weight: 500;
    font-size: 13px;
    color: var(--f7-list-item-title-text-color);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    display: flex;
    align-items: center;
    gap: 4px;
    line-height: 1.2;
}

.required-badge {
    color: var(--f7-color-red);
    font-weight: 700;
}

.field-meta {
    font-size: 10px;
    color: var(--f7-list-item-subtitle-text-color);
    display: flex;
    gap: 6px;
    margin-top: 1px;
}

.field-type {
    background: var(--f7-chip-bg-color);
    padding: 1px 5px;
    border-radius: 3px;
    font-size: 9px;
    text-transform: uppercase;
}

.field-name {
    opacity: 0.6;
    font-family: monospace;
    font-size: 9px;
}

/* Indicators */
.field-indicators {
    display: flex;
    gap: 2px;
}

.indicator {
    font-size: 12px;
    padding: 2px;
    border-radius: 3px;
}

.indicator.formula {
    color: var(--f7-color-blue);
    background: rgba(33, 150, 243, 0.1);
}

.indicator.logic {
    color: var(--f7-color-orange);
    background: rgba(255, 152, 0, 0.1);
}

/* Actions */
.field-actions {
    display: flex;
    gap: 2px;
    opacity: 0;
    transition: opacity 0.15s;
}

.field-list-item:hover .field-actions,
.field-list-item.selected .field-actions {
    opacity: 1;
}

.action-btn {
    padding: 4px;
    border-radius: 4px;
    color: var(--f7-list-item-subtitle-text-color);
    font-size: 14px;
}

.action-btn:hover {
    background: rgba(0, 0, 0, 0.05);
}

.action-btn.delete:hover {
    color: var(--f7-color-red);
    background: rgba(244, 67, 54, 0.1);
}

/* Nested Indicator */
.nested-indicator {
    padding-left: 8px;
    display: flex;
    align-items: center;
}

.nested-indicator :deep(.button) {
    width: 28px;
    height: 28px;
    background: rgba(var(--f7-theme-color-rgb), 0.1);
    color: var(--f7-theme-color);
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
}

.nested-indicator :deep(.button .icon) {
    font-size: 16px;
}
</style>
