<template>
    <f7-list inset class="config-section">
        <f7-list-item group-title>Basic</f7-list-item>

        <f7-list-input label="Field Name" type="text" :value="field.name" placeholder="field_name"
            info="Unique identifier (no spaces)"
            @input="emit('update', { name: ($event.target as HTMLInputElement).value })" />

        <f7-list-input label="Label" type="text" :value="field.label" placeholder="Display Label"
            @input="emit('update', { label: ($event.target as HTMLInputElement).value })" />

        <f7-list-item title="Field Type" smart-select
            :smart-select-params="{ openIn: 'popup', popupCloseLinkText: 'Done', searchbar: false }">
            <select :value="field.type" @change="emit('update', { type: ($event.target as HTMLSelectElement).value })">
                <optgroup v-for="category in ['basic', 'choice', 'media', 'advanced']" :key="category"
                    :label="category.charAt(0).toUpperCase() + category.slice(1)">
                    <option v-for="(meta, type) in getFieldsByCategory(category)" :key="type" :value="type">
                        {{ meta.label }}
                    </option>
                </optgroup>
            </select>
            <f7-icon slot="media" :f7="fieldMeta.icon" />
            <div slot="after">{{ fieldMeta.label }}</div>
        </f7-list-item>
    </f7-list>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { FIELD_TYPE_META, type EditableFieldDefinition, type FieldType } from '../../../types/editor.types';

const props = defineProps<{
    field: EditableFieldDefinition;
    getFieldsByCategory: (category: string) => Record<string, any>;
}>();

const emit = defineEmits<{
    (e: 'update', updates: Partial<EditableFieldDefinition>): void;
}>();

const fieldMeta = computed(() => {
    return FIELD_TYPE_META[props.field.type as FieldType] || FIELD_TYPE_META.text;
});
</script>

<style scoped>
.config-section {
    margin: 8px 12px;
    --f7-list-margin-vertical: 0;
    --f7-list-inset-border-radius: 10px;
}
</style>
