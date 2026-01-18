<template>
    <f7-popup class="add-assignment-popup" :opened="opened" @popup:closed="$emit('close')">
        <f7-page>
            <f7-navbar title="Add Assignment">
                <template #left>
                    <f7-link popup-close>Cancel</f7-link>
                </template>
                <template #right>
                    <f7-link @click="saveAssignment" class="color-green">Save</f7-link>
                </template>
            </f7-navbar>

            <f7-block-title>Prelist Data</f7-block-title>
            <f7-block class="info-block">
                <f7-icon f7="info_circle" />
                <span>Enter the initial data for this assignment. These values will be pre-filled when the enumerator opens the form.</span>
            </f7-block>

            <f7-list inset strong>
                <f7-list-item v-for="field in prelistFields" :key="field.name">
                    <template #title>
                        <span class="field-label">{{ field.label }}</span>
                        <span v-if="field.required" class="required-badge">Required</span>
                    </template>
                    <template #inner>
                        <!-- Text Input -->
                        <input v-if="field.type === 'text'" type="text" :value="formData[field.name]"
                            :placeholder="`Enter ${field.label.toLowerCase()}`"
                            @input="updateField(field.name, ($event.target as HTMLInputElement).value)" />

                        <!-- Number Input -->
                        <input v-else-if="field.type === 'number'" type="number" :value="formData[field.name]"
                            :placeholder="`Enter ${field.label.toLowerCase()}`"
                            @input="updateField(field.name, parseFloat(($event.target as HTMLInputElement).value))" />

                        <!-- Date Input -->
                        <input v-else-if="field.type === 'date'" type="date" :value="formData[field.name]"
                            @input="updateField(field.name, ($event.target as HTMLInputElement).value)" />

                        <!-- Select -->
                        <select v-else-if="field.type === 'select'" :value="formData[field.name]"
                            @change="updateField(field.name, ($event.target as HTMLSelectElement).value)">
                            <option value="">Select...</option>
                            <option v-for="opt in field.options" :key="opt.value" :value="opt.value">
                                {{ opt.label }}
                            </option>
                        </select>

                        <!-- Fallback Text Input -->
                        <input v-else type="text" :value="formData[field.name]"
                            :placeholder="`Enter ${field.label.toLowerCase()}`"
                            @input="updateField(field.name, ($event.target as HTMLInputElement).value)" />
                    </template>
                </f7-list-item>
            </f7-list>

            <f7-block-title>Assignment</f7-block-title>
            <f7-list inset strong>
                <f7-list-item title="Assign To" smart-select :smart-select-params="{ openIn: 'popover' }">
                    <select v-model="assignedTo">
                        <option value="">Unassigned</option>
                        <option v-for="user in availableEnumerators" :key="user.id" :value="user.id">
                            {{ user.name }}
                        </option>
                    </select>
                </f7-list-item>
            </f7-list>
        </f7-page>
    </f7-popup>
</template>

<script setup lang="ts">
import { f7 } from 'framework7-vue';
import { computed, reactive, ref, watch } from 'vue';
import { useSchemaEditor } from '../../composables/useSchemaEditor';

// ============================================================================
// Props & Emits
// ============================================================================

interface Props {
    opened: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
    close: [];
    save: [data: { prelistData: Record<string, unknown>; assignedTo: string | null }];
}>();

// ============================================================================
// State
// ============================================================================

const { fields } = useSchemaEditor();

const formData = reactive<Record<string, unknown>>({});
const assignedTo = ref<string>('');

// Mock enumerators - TODO: Load from API
const availableEnumerators = ref([
    { id: 'enum1', name: 'Enumerator A' },
    { id: 'enum2', name: 'Enumerator B' },
    { id: 'enum3', name: 'Enumerator C' },
]);

// ============================================================================
// Computed
// ============================================================================

const prelistFields = computed(() => {
    // Filter fields that make sense for prelist (text, number, select, date)
    const allowedTypes = ['text', 'number', 'date', 'select', 'radio'];
    return (fields.value || []).filter(f => allowedTypes.includes(f.type));
});

// ============================================================================
// Methods
// ============================================================================

function updateField(name: string, value: unknown) {
    formData[name] = value;
}

function saveAssignment() {
    // Validate required fields
    const missingFields = prelistFields.value
        .filter(f => f.required && !formData[f.name])
        .map(f => f.label);

    if (missingFields.length > 0) {
        f7.dialog.alert(`Please fill required fields: ${missingFields.join(', ')}`);
        return;
    }

    emit('save', {
        prelistData: { ...formData },
        assignedTo: assignedTo.value || null,
    });

    emit('close');
    f7.toast.show({ text: 'Assignment added', position: 'center', closeTimeout: 2000 });
}

// Reset form on close
watch(() => props.opened, (isOpen) => {
    if (!isOpen) {
        Object.keys(formData).forEach(key => delete formData[key]);
        assignedTo.value = '';
    }
});
</script>

<style scoped>
.info-block {
    display: flex;
    gap: 12px;
    align-items: flex-start;
    background: rgba(var(--f7-theme-color-rgb), 0.1);
    padding: 12px 16px;
    border-radius: 8px;
    font-size: 13px;
    color: var(--f7-list-item-subtitle-text-color);
}

.info-block :deep(.icon) {
    font-size: 18px;
    color: var(--f7-theme-color);
    flex-shrink: 0;
}

.field-label {
    font-weight: 500;
}

.required-badge {
    font-size: 10px;
    color: var(--f7-color-red);
    margin-left: 6px;
}

/* Input styling */
:deep(.item-inner) input,
:deep(.item-inner) select {
    width: 100%;
    padding: 8px 12px;
    margin-top: 8px;
    border: 1px solid var(--f7-list-border-color);
    border-radius: 6px;
    font-size: 14px;
    background: var(--f7-list-item-bg-color);
}

:deep(.item-inner) input:focus,
:deep(.item-inner) select:focus {
    outline: none;
    border-color: var(--f7-theme-color);
}
</style>
