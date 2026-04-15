<template>
    <f7-list inset class="config-section">
        <f7-list-item group-title>Display</f7-list-item>

        <f7-list-input label="Hint Text" type="text" :value="field.hint" placeholder="Help text shown below field"
            @input="emit('update', { hint: ($event.target as HTMLInputElement).value })" />

        <f7-list-item>
            <span>Searchable</span>
            <f7-toggle slot="after" :checked="field.searchable"
                @toggle:change="emit('update', { searchable: $event })" />
        </f7-list-item>

        <f7-list-item>
            <span>Show in Preview</span>
            <f7-toggle slot="after" :checked="field.preview" @toggle:change="emit('update', { preview: $event })" />
        </f7-list-item>

        <!-- Smart Read-only Toggle -->
        <f7-list-item class="readonly-toggle-item" :class="{ 'is-readonly': isReadonly }">
            <div class="toggle-content">
                <div class="toggle-label">
                    <f7-icon f7="lock_fill" size="13" class="lock-icon" />
                    Always Read-only
                </div>
                <div class="toggle-description" v-if="isReadonly">
                    Managed via <code>editable_if_fn</code>
                </div>
            </div>
            <f7-toggle slot="after" color="red" :checked="isReadonly" @toggle:change="onReadonlyToggle" />
        </f7-list-item>
    </f7-list>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { EditableFieldDefinition } from '../../../types/editor.types';

// Sentinel value written to editable_if_fn when simple toggle is ON
const READONLY_SENTINEL = 'return false;';

const props = defineProps<{
    field: EditableFieldDefinition;
}>();

const emit = defineEmits<{
    (e: 'update', updates: Partial<EditableFieldDefinition>): void;
}>();

/** True when the simple "always read-only" toggle is active */
const isReadonly = computed(() =>
    (props.field.editable_if_fn ?? '').trim() === READONLY_SENTINEL
);

const onReadonlyToggle = (checked: boolean) => {
    if (checked) {
        // Activate: set sentinel value.
        emit('update', { editable_if_fn: READONLY_SENTINEL });
    } else {
        // Deactivate: clear the sentinel so the field becomes editable again
        emit('update', { editable_if_fn: '' });
    }
};
</script>

<style scoped>
.config-section {
    margin: 8px 12px;
    --f7-list-margin-vertical: 0;
    --f7-list-inset-border-radius: 10px;
}

.readonly-toggle-item {
    transition: background 0.2s;
}

.readonly-toggle-item.is-readonly {
    background-color: rgba(255, 59, 48, 0.05);
}

.toggle-content {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.toggle-label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    color: #1a1a1a;
}

.lock-icon {
    color: #ff3b30;
    opacity: 0.7;
}

.readonly-toggle-item.is-readonly .lock-icon {
    opacity: 1;
}

.toggle-description {
    font-size: 11px;
    color: #999;
}

.toggle-description code {
    font-size: 10px;
    background: #f0f0f0;
    padding: 1px 4px;
    border-radius: 3px;
    color: #555;
}
</style>
