<template>
    <div class="nested-form-container">
        <f7-block-title class="display-flex justify-content-space-between align-items-center">
            <span>{{ field.label }}</span>
            <span v-if="error" class="text-color-red size-12 font-normal normal-case">{{ error }}</span>
        </f7-block-title>

        <f7-list inset strong>
            <f7-list-item v-for="(item, index) in modelValue" :key="index" :title="getSummary(item, index)" link="#"
                @click="editRow(index)">
                <template #after v-if="!field.readonly">
                    <f7-link icon-f7="trash" color="red" @click.stop="removeRow(index)" />
                </template>
            </f7-list-item>

            <f7-list-button v-if="!field.readonly" title="Add Item" color="blue" @click="addRow"></f7-list-button>
        </f7-list>

        <!-- Popup Editor for Large Forms -->
        <f7-popup :opened="isPopupOpen" @popup:closed="closePopup">
            <f7-page>
                <f7-navbar :title="popupTitle">
                    <f7-nav-right>
                        <f7-link @click="closePopup">Done</f7-link>
                    </f7-nav-right>
                </f7-navbar>

                <f7-block class="no-margin-top">
                    <FormRenderer v-if="currentEditingIndex !== null" :schema="effectiveSchema"
                        :initial-data="modelValue[currentEditingIndex]" :context="childContext"
                        @update:data="(newData) => updateRow(currentEditingIndex!, newData)" />
                </f7-block>
            </f7-page>
        </f7-popup>
    </div>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, onMounted, onUnmounted, ref } from 'vue';
import type { FieldDefinition } from '../../types/schema';

// Lazy load recursive component
const FormRenderer = defineAsyncComponent(() => import('../FormRenderer.vue'));

const props = defineProps<{
    field: FieldDefinition;
    value?: any[];
    error?: string | null;
    context?: Record<string, any>; // Context from parent (assignment, user, parentRow)
    parentFormData?: Record<string, any>; // Parent form data for cross-reference
}>();

const emit = defineEmits(['update:value']);

const isPopupOpen = ref(false);
const currentEditingIndex = ref<number | null>(null);

// Method to open a specific item and scroll to a field within it
// Defined early so it can be used in event handler
const openItemAndScrollToField = (index: number, fieldName: string) => {
    currentEditingIndex.value = index;
    isPopupOpen.value = true;

    // Wait for popup to open and render, then scroll to field
    setTimeout(() => {
        const element = document.querySelector(`[data-field-name="${fieldName}"]`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.classList.add('highlight-field');
            setTimeout(() => element.classList.remove('highlight-field'), 2000);
        }
    }, 400); // Wait for popup animation
};

// Listen for custom event to open nested// Event logic
const handleOpenNestedField = (event: Event) => {
    const detail = (event as CustomEvent).detail;
    console.log('[DEBUG] NestedFormField received event:', detail.parentField, 'Target:', detail.childFieldName);

    if (detail.parentField === props.field.name) {
        console.log('[DEBUG] Matched parent field! Opening item index:', detail.index);
        openItemAndScrollToField(detail.index, detail.childFieldName);
    } else {
        console.log('[DEBUG] Ignored (Name mismatch):', props.field.name, '!=', detail.parentField);
    }
};

const handleCloseAllPopups = () => {
    isPopupOpen.value = false;
};

onMounted(() => {
    window.addEventListener('open-nested-field', handleOpenNestedField);
    window.addEventListener('close-nested-popups', handleCloseAllPopups);
});

onUnmounted(() => {
    window.removeEventListener('open-nested-field', handleOpenNestedField);
    window.removeEventListener('close-nested-popups', handleCloseAllPopups);
});

const modelValue = computed({
    get: () => props.value || [],
    set: (val) => emit('update:value', val)
});

const popupTitle = computed(() => {
    const action = props.field.readonly ? 'View' : 'Edit';
    return currentEditingIndex.value !== null
        ? `${action} ${props.field.label} #${currentEditingIndex.value + 1}`
        : props.field.label;
});

// Force children to be readonly if parent is readonly
const effectiveSchema = computed(() => {
    return {
        id: props.field.id + '_child',
        fields: (props.field.fields || []).map(f => {
            if (props.field.readonly) {
                return { ...f, editable_if: 'false' };
            }
            return f;
        })
    };
});

// Create enriched context for child FormRenderer
// Allows nested closures to access parent data
const childContext = computed(() => {
    return {
        ...(props.context || {}),
        parentRow: props.parentFormData || {},  // Access parent form data
        rowIndex: currentEditingIndex.value,     // Current row index
        allRows: modelValue.value                // All nested rows
    };
});

// Intelligent Summary: Find the first meaningful text field to use as title
const summaryKey = computed(() => {
    if (!props.field.fields) return null;
    const meaningfulField = props.field.fields.find(f => ['text', 'select', 'radio'].includes(f.type));
    return meaningfulField ? meaningfulField.name : null;
});

const getSummary = (item: any, index: number) => {
    if (summaryKey.value && item[summaryKey.value]) {
        return item[summaryKey.value];
    }
    return `${props.field.label} #${index + 1}`;
};

const addRow = () => {
    const newVal = [...modelValue.value, {}];
    emit('update:value', newVal);
    // Auto open the new item
    editRow(newVal.length - 1);
};

const removeRow = (index: number) => {
    const newVal = [...modelValue.value];
    newVal.splice(index, 1);
    emit('update:value', newVal);
};

const updateRow = (index: number, newData: any) => {
    const newVal = [...modelValue.value];
    newVal[index] = newData;
    emit('update:value', newVal);
};

const editRow = (index: number) => {
    currentEditingIndex.value = index;
    isPopupOpen.value = true;
};

const closePopup = () => {
    isPopupOpen.value = false;
    currentEditingIndex.value = null;
};

defineExpose({ openItemAndScrollToField });
</script>

<style scoped>
.nested-form-container {
    margin-bottom: 24px;
}
</style>
