<template>
    <div class="field-config-panel">
        <!-- Header -->
        <div class="config-header">
            <h4 class="config-title">
                <f7-icon :f7="fieldMeta.icon" class="title-icon" />
                {{ field?.label || 'Field Settings' }}
            </h4>
            <div class="header-actions">
                <f7-button v-if="isModified" small round outline color="orange" class="reset-btn"
                    @click="emit('reset')">
                    Reset
                </f7-button>
                <f7-link icon-f7="xmark_circle" class="close-btn" @click="emit('close')" />
            </div>
        </div>

        <!-- No Selection State -->
        <div v-if="!field" class="no-selection">
            <f7-icon f7="hand_tap" class="empty-icon" />
            <p>Select a field to edit its properties</p>
        </div>

        <!-- Config Form -->
        <div v-else class="config-content">
            <FieldBasicSection :field="field" :get-fields-by-category="getFieldsByCategory" @update="updateFieldFn" />

            <FieldValidationSection :field="field" @update="updateFieldFn" />

            <FieldOptionsSection v-if="hasOptions" :field="field" @add-option="addOption" @update-option="updateOption"
                @remove-option="removeOption" />

            <FieldDisplaySection :field="field" @update="updateFieldFn" />

            <FieldLogicSection :field="field" :all-fields="allFields" :has-options="hasOptions"
                :get-syntax-error="getSyntaxError" :copy-to-clipboard="copyToClipboard" :get-field-icon="getFieldIcon"
                @update="updateFieldFn" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { FIELD_TYPE_META, type EditableFieldDefinition, type FieldType } from '../../types/editor.types';

// Sections
import FieldBasicSection from './sections/FieldBasicSection.vue';
import FieldDisplaySection from './sections/FieldDisplaySection.vue';
import FieldLogicSection from './sections/FieldLogicSection.vue';
import FieldOptionsSection from './sections/FieldOptionsSection.vue';
import FieldValidationSection from './sections/FieldValidationSection.vue';

// Composables
import { useFieldConfig } from './composables/useFieldConfig';
import { useLogicHelpers } from './composables/useLogicHelpers';

// ============================================================================
// Props & Emits
// ============================================================================

interface Props {
    field: EditableFieldDefinition | null;
    originalField?: EditableFieldDefinition | null;
    allFields?: EditableFieldDefinition[];
}

const props = defineProps<Props>();

const emit = defineEmits<{
    close: [];
    reset: [];
    update: [updates: Partial<EditableFieldDefinition>];
}>();

// ============================================================================
// Logic Helpers
// ============================================================================
const { getSyntaxError, copyToClipboard, getFieldIcon, getFieldsByCategory } = useLogicHelpers();

// ============================================================================
// Field Config Logic
// ============================================================================
// Unwrap updateField to avoid name collision in template if needed, or just alias it
const { isModified, hasOptions, updateField: updateFieldFn, addOption, updateOption, removeOption } = useFieldConfig(props, (event, updates) => {
    if (event === 'update') {
        emit('update', updates);
    }
});

// ============================================================================
// Computed
// ============================================================================
const fieldMeta = computed(() => {
    if (!props.field) return FIELD_TYPE_META.text;
    const type = props.field.type as FieldType;
    return FIELD_TYPE_META[type] || FIELD_TYPE_META.text;
});
</script>

<style scoped>
/* ============================================================================
   Field Config Panel Styles
   ============================================================================ */

.field-config-panel {
    height: 100%;
    display: flex;
    flex-direction: column;
    background: var(--editor-bg, #f8fafc);
}

/* Header */
.config-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    border-bottom: 1px solid var(--editor-border, #e2e8f0);
    background: var(--editor-surface, #ffffff);
    flex-shrink: 0;
}

.config-title {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    color: var(--editor-text-primary, #1e293b);
    display: flex;
    align-items: center;
    gap: 8px;
}

.title-icon {
    color: var(--editor-primary, #3b82f6);
    font-size: 18px;
}

.close-btn {
    color: var(--editor-text-muted, #94a3b8);
    font-size: 20px;
    transition: color 0.15s;
}

.close-btn:hover {
    color: var(--editor-text-secondary, #64748b);
}

.header-actions {
    display: flex;
    align-items: center;
    gap: 8px;
}

.reset-btn {
    height: 24px;
    line-height: 22px;
    font-size: 11px;
    font-weight: 600;
    padding: 0 10px;
}

/* No Selection */
.no-selection {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 32px;
    text-align: center;
    color: var(--editor-text-muted, #94a3b8);
}

.empty-icon {
    font-size: 40px;
    opacity: 0.4;
    margin-bottom: 12px;
}

/* Content - Scrollable */
.config-content {
    flex: 1;
    overflow-y: auto;
    padding: 8px 0;
    min-height: 0;
}
</style>
