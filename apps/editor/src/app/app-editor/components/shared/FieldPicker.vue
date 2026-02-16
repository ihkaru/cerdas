<template>
    <div class="field-picker">
        <label v-if="label" class="picker-label">{{ label }}</label>
        <div class="picker-wrapper" :class="{ open: isOpen }">
            <button type="button" class="picker-trigger" ref="triggerBtn" @click="toggle">
                <f7-icon v-if="selectedField" :f7="getFieldIcon(selectedField.type)" class="field-icon" />
                <span class="selected-value">
                    {{ selectedField ? selectedField.label : placeholder }}
                </span>
                <span v-if="selectedField" class="selected-name-hint">{{ selectedField.name }}</span>
                <f7-icon f7="chevron_down" class="chevron" />
            </button>

            <Teleport to="body">
                <Transition name="dropdown">
                    <div v-if="isOpen" class="picker-dropdown" :style="dropdownStyle" ref="dropdownEl">
                        <!-- Search Bar -->
                        <div class="picker-search">
                            <f7-icon f7="search" size="14" class="search-icon" />
                            <input ref="searchInput" type="text" v-model="searchQuery" placeholder="Search fields..."
                                class="search-input" @click.stop @mousedown.stop />
                            <button v-if="searchQuery" type="button" class="clear-search"
                                @click.stop="searchQuery = ''">
                                <f7-icon f7="xmark_circle_fill" size="14" />
                            </button>
                        </div>

                        <div class="picker-options-list">
                            <!-- None Option -->
                            <button v-if="allowNone && !searchQuery" type="button" class="picker-option none"
                                :class="{ active: !modelValue }" @click="selectField(null)">
                                <f7-icon f7="xmark" class="field-icon" />
                                <span>None</span>
                            </button>

                            <!-- Field Options -->
                            <button v-for="field in filteredFields" :key="field.name" type="button"
                                class="picker-option" :class="{ active: modelValue === field.name }"
                                @click="selectField(field.name)">
                                <div class="option-icon-wrapper" :class="field.type">
                                    <f7-icon :f7="getFieldIcon(field.type)" class="field-icon" />
                                </div>
                                <div class="option-info">
                                    <span class="option-label">{{ field.label }}</span>
                                    <span class="option-name">{{ field.name }}</span>
                                </div>
                                <div class="option-meta">
                                    <span class="type-badge">{{ getFieldTypeName(field.type) }}</span>
                                    <f7-icon v-if="modelValue === field.name" f7="checkmark" class="check-icon"
                                        size="14" />
                                </div>
                            </button>

                            <!-- Empty State -->
                            <div v-if="filteredFields.length === 0" class="empty-state">
                                <f7-icon f7="search" />
                                <span>No fields found</span>
                            </div>
                        </div>
                    </div>
                </Transition>
            </Teleport>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
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
const searchQuery = ref('');
const searchInput = ref<HTMLInputElement | null>(null);
const triggerBtn = ref<HTMLElement | null>(null);
const dropdownEl = ref<HTMLElement | null>(null);

// Dropdown positioning state
const dropdownStyle = ref({
    top: '0px',
    left: '0px',
    width: '0px',
    zIndex: '99999' // Ensure it's above other overlays
});

// ============================================================================
// Computed
// ============================================================================

const filteredFields = computed(() => {
    let result = props.fields;

    // 1. Filter by Type
    if (props.filterTypes && props.filterTypes.length > 0) {
        result = result.filter(f => props.filterTypes?.includes(f.type as FieldType));
    }

    // 2. Filter by Search
    if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase();
        result = result.filter(f =>
            (f.name || '').toLowerCase().includes(query) ||
            (f.label || '').toLowerCase().includes(query) ||
            (f.type || '').toLowerCase().includes(query)
        );
    }

    return result;
});

const selectedField = computed(() => {
    if (!props.modelValue) return null;
    return props.fields.find(f => f.name === props.modelValue) || null;
});

// ============================================================================
// Methods
// ============================================================================

function updatePosition() {
    if (!triggerBtn.value || !isOpen.value) return;

    const rect = triggerBtn.value.getBoundingClientRect();
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollLeft = window.scrollX || document.documentElement.scrollLeft;

    const minWidth = 260;
    const dropdownWidth = Math.max(rect.width, minWidth);

    dropdownStyle.value = {
        top: `${rect.bottom + scrollTop + 4}px`,
        left: `${rect.left + scrollLeft}px`,
        width: `${dropdownWidth}px`,
        zIndex: '99999'
    };
}

function toggle() {
    if (isOpen.value) {
        close();
    } else {
        open();
    }
}

function open() {
    isOpen.value = true;
    searchQuery.value = ''; // Reset search

    // Calculate initial position
    nextTick(() => {
        updatePosition();
        if (searchInput.value) {
            searchInput.value.focus();
        }
    });

    // Add listeners to handle closing or repositioning
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true); // true for capturing phase to catch parent scrolls
}

function close() {
    isOpen.value = false;
    window.removeEventListener('resize', updatePosition);
    window.removeEventListener('scroll', updatePosition, true);
}

function selectField(fieldName: string | null) {
    emit('update:modelValue', fieldName);
    close();
}

function getFieldIcon(type: string): string {
    const meta = FIELD_TYPE_META[type as FieldType];
    return meta?.icon || 'square';
}

function getFieldTypeName(type: string): string {
    const meta = FIELD_TYPE_META[type as FieldType];
    return meta?.label || type;
}

// Close on click outside
function handleClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;

    // Check if clicking inside trigger or dropdown
    const isTrigger = triggerBtn.value?.contains(target);
    const isDropdown = dropdownEl.value?.contains(target);

    if (!isTrigger && !isDropdown) {
        close();
    }
}

// Add/remove listener
onMounted(() => document.addEventListener('mousedown', handleClickOutside));
onUnmounted(() => {
    document.removeEventListener('mousedown', handleClickOutside);
    window.removeEventListener('resize', updatePosition);
    window.removeEventListener('scroll', updatePosition, true);
});

// Watch search to scroll to top?
watch(searchQuery, () => {
    // optional: scroll list to top
});
</script>

<style scoped>
.field-picker {
    position: relative;
    width: 100%;
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
    padding: 8px 12px;
    background: #ffffff;
    background-color: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.15s;
    text-align: left;
    font-family: inherit;
    font-size: 14px;
    min-height: 40px;
}

.picker-trigger:hover {
    border-color: #cbd5e1;
    background-color: #f8fafc;
}

.picker-wrapper.open .picker-trigger {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    background-color: #ffffff;
}

.selected-name-hint {
    font-size: 11px;
    color: #94a3b8;
    background: #f1f5f9;
    padding: 2px 6px;
    border-radius: 4px;
    font-family: monospace;
    margin-right: 4px;
}

.field-icon {
    font-size: 16px;
    color: #64748b;
}

.selected-value {
    flex: 1;
    font-size: 14px;
    color: #1e293b;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
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
    /* top, left, width set via JS */
    min-width: 260px;
    background: #ffffff;
    background-color: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);

    /* Ensure it floats above everything */
    z-index: 99999;

    overflow: hidden;
    display: flex;
    flex-direction: column;
}

/* Search */
.picker-search {
    padding: 8px;
    border-bottom: 1px solid #f1f5f9;
    display: flex;
    align-items: center;
    gap: 8px;
    background: #f8fafc;
}

.search-icon {
    color: #94a3b8;
}

.search-input {
    flex: 1;
    border: none;
    background: transparent;
    font-size: 13px;
    outline: none;
    color: #1e293b;
    font-family: inherit;
}

.clear-search {
    border: none;
    background: none;
    padding: 0;
    color: #cbd5e1;
    cursor: pointer;
    display: flex;
    align-items: center;
}

.clear-search:hover {
    color: #94a3b8;
}

/* Options List */
.picker-options-list {
    max-height: 240px;
    overflow-y: auto;
    padding: 4px 0;
}

.picker-option {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 8px 12px;
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
    background: #eff6ff;
}

.picker-option.none {
    color: #64748b;
    border-bottom: 1px solid #f1f5f9;
}

.option-icon-wrapper {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f1f5f9;
    border-radius: 6px;
    flex-shrink: 0;
}

.option-icon-wrapper.text,
.option-icon-wrapper.number {
    color: #3b82f6;
    background: #eff6ff;
}

.option-icon-wrapper.date {
    color: #8b5cf6;
    background: #f5f3ff;
}

.option-icon-wrapper.select,
.option-icon-wrapper.radio {
    color: #f59e0b;
    background: #fffbeb;
}

.option-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.option-label {
    font-size: 13px;
    color: #1e293b;
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.option-name {
    font-size: 11px;
    color: #64748b;
    font-family: monospace;
}

.option-meta {
    display: flex;
    align-items: center;
    gap: 8px;
}

.type-badge {
    font-size: 10px;
    padding: 2px 6px;
    background: #f1f5f9;
    border-radius: 4px;
    color: #64748b;
    text-transform: capitalize;
}

.check-icon {
    color: #3b82f6;
}

.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 24px;
    color: #94a3b8;
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
