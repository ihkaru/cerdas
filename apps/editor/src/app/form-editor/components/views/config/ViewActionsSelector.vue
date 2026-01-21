<template>
    <div class="view-actions">
        <f7-block-title>View Actions</f7-block-title>
        <f7-list inset strong>
            <f7-list-item v-for="action in availableActions" :key="action.id" :title="action.label" checkbox
                :checked="selectedActions.includes(action.id)" @change="toggleAction(action.id)">
                <f7-icon slot="media" :f7="action.icon" />
                <template #footer>
                    <div class="text-xs text-gray-500">{{ action.type }}</div>
                </template>
            </f7-list-item>
            <f7-list-item v-if="availableActions.length === 0" title="No actions defined in settings" />
        </f7-list>
    </div>
</template>

<script setup lang="ts">

import type { ActionDefinition } from '../../../types/editor.types';

const props = defineProps<{
    selectedActions: string[];
    availableActions: readonly ActionDefinition[];
}>();

const emit = defineEmits<{
    (e: 'toggle', actionId: string): void
}>();

function toggleAction(id: string) {
    emit('toggle', id);
}
</script>

<style scoped>
.text-xs {
    font-size: 0.75rem;
}

.text-gray-500 {
    color: #6b7280;
}
</style>
