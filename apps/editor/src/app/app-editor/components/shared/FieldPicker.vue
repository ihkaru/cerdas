<template>
    <div class="field-picker">
        <label v-if="label" class="picker-label">{{ label }}</label>
        <div class="picker-wrapper" :class="{ open: isOpen }">
            <button type="button" class="picker-trigger" @click="toggle">
                <f7-icon v-if="selectedField" :f7="getFieldIcon(selectedField.type)" class="field-icon" />
                <span class="selected-value">
                    {{ selectedField ? selectedField.label : placeholder }}
                </span>
                <f7-icon f7="chevron_down" class="chevron" />
            </button>

            <Transition name="dropdown">
                <div v-if="isOpen" class="picker-dropdown">
                    <!-- None Option -->
                    <button v-if="allowNone" type="button" class="picker-option none" :class="{ active: !modelValue }"
                        @click="selectField(null)">
                        <f7-icon f7="xmark" class="field-icon" />
                        <span>None</span>
                    </button>

                    <!-- Field Options -->
                    <button v-for="field in filteredFields" :key="field.name" type="button" class="picker-option"
                        :class="{ active: modelValue === field.name }" @click="selectField(field.name)">
                        <f7-icon :f7="getFieldIcon(field.type)" class="field-icon" />
                        <div class="option-info">
                            <span class="option-label">{{ field.label }}</span>
                            <span class="option-name">{{ field.name }}</span>
                        </div>
                        <f7-icon v-if="modelValue === field.name" f7="checkmark" class="check-icon" />
                    </button>

                    <!-- Empty State -->
                    <div v-if="filteredFields.length === 0" class="empty-state">
                        <f7-icon f7="square_list" />
                        <span>No fields available</span>
                    </div>
                </div>
            </Transition>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { FIELD_TYPE_META, type EditableFieldDefinition, type FieldType } from '../../types/editor.types';

// ============================================================================
// Props & Emits
// ============================================================================

interface Props {
    /** Selected field name */
    modelValue: string | null;
    /** Available fields to pick from */
    fields: EditableFieldDefinition[];
    /** Label for the picker */
    label?: string;
    /** Placeholder when nothing selected */
    placeholder?: string;
    /** Allow selecting "None" */
    allowNone?: boolean;
    /** Filter by field types */
    filterTypes?: FieldType[];
}

const props = withDefaults(defineProps<Props>(), {
    placeholder: 'Select field...',
    allowNone: true,
});

const emit = defineEmits<{
    'update:modelValue': [value: string | null];
}>();

// ============================================================================
// State
// ============================================================================

const isOpen = ref(false);

// ============================================================================
// Computed
// ============================================================================

const filteredFields = computed(() => {
    if (!props.filterTypes || props.filterTypes.length === 0) {
        return props.fields;
    }
    return props.fields.filter(f => props.filterTypes?.includes(f.type as FieldType));
});

const selectedField = computed(() => {
    if (!props.modelValue) return null;
    return props.fields.find(f => f.name === props.modelValue) || null;
});

// ============================================================================
// Methods
// ============================================================================

function toggle() {
    isOpen.value = !isOpen.value;
}

function selectField(fieldName: string | null) {
    emit('update:modelValue', fieldName);
    isOpen.value = false;
}

function getFieldIcon(type: string): string {
    const meta = FIELD_TYPE_META[type as FieldType];
    return meta?.icon || 'square';
}

// Close on click outside
function handleClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.field-picker')) {
        isOpen.value = false;
    }
}

// Add/remove listener
import { onMounted, onUnmounted } from 'vue';
onMounted(() => document.addEventListener('click', handleClickOutside));
onUnmounted(() => document.removeEventListener('click', handleClickOutside));
</script>

<style scoped>
.field-picker {
    position: relative;
}

.picker-label {
    display: block;
    font-size: 12px;
    font-weight: 500;
    color: var(--f7-list-item-subtitle-text-color);
    margin-bottom: 6px;
}

.picker-wrapper {
    position: relative;
}

.picker-trigger {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 10px 12px;
    background: #ffffff;
    background-color: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    cursor: pointer;
    transition: border-color 0.15s, box-shadow 0.15s;
    text-align: left;
    font-family: inherit;
    font-size: 14px;
}

.picker-trigger:hover {
    border-color: #3b82f6;
}

.picker-wrapper.open .picker-trigger {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.field-icon {
    font-size: 16px;
    color: #3b82f6;
}

.selected-value {
    flex: 1;
    font-size: 14px;
    color: #1e293b;
}

.picker-trigger:not(:has(.field-icon)) .selected-value {
    color: #94a3b8;
}

.chevron {
    font-size: 12px;
    color: #94a3b8;
    transition: transform 0.2s;
}

.picker-wrapper.open .chevron {
    transform: rotate(180deg);
}

/* Dropdown */
.picker-dropdown {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    right: 0;
    background: #ffffff;
    background-color: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
    z-index: 1000;
    max-height: 240px;
    overflow-y: auto;
}

.picker-option {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 10px 12px;
    background: none;
    border: none;
    cursor: pointer;
    text-align: left;
    transition: background 0.1s;
}

.picker-option:hover {
    background: #f1f5f9;
}

.picker-option.active {
    background: rgba(59, 130, 246, 0.1);
}

.picker-option.none {
    color: #64748b;
    border-bottom: 1px solid #e2e8f0;
}

.option-info {
    flex: 1;
    display: flex;
    flex-direction: column;
}

.option-label {
    font-size: 14px;
    color: #1e293b;
}

.option-name {
    font-size: 11px;
    color: #64748b;
    font-family: monospace;
}

.check-icon {
    font-size: 14px;
    color: #3b82f6;
}

.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 24px;
    color: var(--f7-list-item-subtitle-text-color);
    font-size: 13px;
}

.empty-state :deep(.icon) {
    font-size: 24px;
    opacity: 0.5;
}

/* Dropdown Animation */
.dropdown-enter-active,
.dropdown-leave-active {
    transition: opacity 0.15s, transform 0.15s;
}

.dropdown-enter-from,
.dropdown-leave-to {
    opacity: 0;
    transform: translateY(-8px);
}
</style>
