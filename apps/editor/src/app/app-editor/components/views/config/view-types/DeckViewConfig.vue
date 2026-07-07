<template>
    <div class="deck-config">
        <f7-block-title>Deck Card Layout</f7-block-title>
        <f7-list inset strong>
            <f7-list-item :class="{ 'highlighted-option': highlightedViewOption === 'primaryHeaderField' }">
                <template #title>Primary Header</template>
                <template #after>
                    <FieldPicker :model-value="deckConfig.primaryHeaderField" :fields="fields" :allow-none="false"
                        placeholder="Select field..."
                        @update:model-value="$emit('update', 'primaryHeaderField', $event)" />
                </template>
            </f7-list-item>
            <f7-list-item :class="{ 'highlighted-option': highlightedViewOption === 'secondaryHeaderField' }">
                <template #title>Secondary Header</template>
                <template #after>
                    <FieldPicker :model-value="deckConfig.secondaryHeaderField" :fields="fields" :allow-none="true"
                        placeholder="Select field..."
                        @update:model-value="$emit('update', 'secondaryHeaderField', $event)" />
                </template>
            </f7-list-item>
            <f7-list-item :class="{ 'highlighted-option': highlightedViewOption === 'imageField' }">
                <template #title>Image Field</template>
                <template #after>
                    <FieldPicker :model-value="deckConfig.imageField || null" :fields="fields" :allow-none="true"
                        :filter-types="['image']" placeholder="None"
                        @update:model-value="$emit('update', 'imageField', $event)" />
                </template>
            </f7-list-item>
            <f7-list-item title="Image Shape">
                <f7-segmented slot="after" strong>
                    <f7-button :active="deckConfig.imageShape === 'square'"
                        @click="$emit('update', 'imageShape', 'square')">Square</f7-button>
                    <f7-button :active="deckConfig.imageShape === 'circle'"
                        @click="$emit('update', 'imageShape', 'circle')">Circle</f7-button>
                </f7-segmented>
            </f7-list-item>
        </f7-list>
    </div>
</template>

<script setup lang="ts">
import { inject } from 'vue';
import type { Ref } from 'vue';
import type { DeckConfigProps } from '../../../../types/view-config.types';
import FieldPicker from '../../../shared/FieldPicker.vue';

defineProps<DeckConfigProps>();

defineEmits<{
    (e: 'update', key: string, value: any): void
}>();

const highlightedViewOption = inject<Ref<string> | null>('highlightedViewOption', null);
</script>

<style scoped>
.highlighted-option {
    animation: option-highlight-pulse 1.2s ease-in-out infinite alternate;
    border-radius: 6px;
    margin: 2px 0;
    transition: all 0.3s ease;
}

@keyframes option-highlight-pulse {
    from {
        background-color: transparent;
        box-shadow: 0 0 0 0px rgba(33, 150, 243, 0);
    }
    to {
        background-color: rgba(33, 150, 243, 0.15);
        box-shadow: 0 0 0 2px #2196f3;
    }
}
</style>
