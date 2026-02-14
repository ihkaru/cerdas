import { computed } from 'vue';
import type { EditableFieldDefinition } from '../../../types/editor.types';

export function useFieldConfig(
    props: {
        field: EditableFieldDefinition | null;
        originalField?: EditableFieldDefinition | null;
    },
    emit: (event: 'update', updates: Partial<EditableFieldDefinition>) => void
) {
    const isModified = computed(() => {
        if (!props.field || !props.originalField) {
            return false;
        }
        // Simple deep comparison
        const current = JSON.stringify(props.field);
        const original = JSON.stringify(props.originalField);
        return current !== original;
    });

    const hasOptions = computed(() => {
        return ['select', 'radio', 'checkbox'].includes(props.field?.type || '');
    });

    function updateField(updates: Partial<EditableFieldDefinition>) {
        emit('update', updates);
    }

    function addOption() {
        if (!props.field) return;

        const options = [...(props.field.options || [])];
        const newIndex = options.length + 1;
        options.push({ value: `option${newIndex}`, label: `Option ${newIndex}` });

        emit('update', { options });
    }

    function updateOption(index: number, key: 'value' | 'label', newValue: string) {
        if (!props.field) return;

        const options = [...(props.field.options || [])];
        if (options[index]) {
            options[index] = { ...options[index], [key]: newValue };
            emit('update', { options });
        }
    }

    function removeOption(index: number) {
        if (!props.field) return;

        const options = [...(props.field.options || [])];
        options.splice(index, 1);
        emit('update', { options });
    }

    return {
        isModified,
        hasOptions,
        updateField,
        addOption,
        updateOption,
        removeOption
    };
}
