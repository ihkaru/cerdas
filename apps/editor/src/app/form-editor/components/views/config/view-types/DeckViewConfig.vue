<template>
    <div class="deck-config">
        <f7-block-title>Deck Card Layout</f7-block-title>
        <f7-list inset strong>
            <f7-list-item>
                <template #title>Primary Header</template>
                <template #after>
                    <FieldPicker :model-value="deckConfig.primaryHeaderField" :fields="fields" :allow-none="false"
                        placeholder="Select field..."
                        @update:model-value="$emit('update', 'primaryHeaderField', $event)" />
                </template>
            </f7-list-item>
            <f7-list-item>
                <template #title>Secondary Header</template>
                <template #after>
                    <FieldPicker :model-value="deckConfig.secondaryHeaderField" :fields="fields" :allow-none="true"
                        placeholder="Select field..."
                        @update:model-value="$emit('update', 'secondaryHeaderField', $event)" />
                </template>
            </f7-list-item>
            <f7-list-item>
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

import type { DeckConfigProps } from '../../../../types/view-config.types';
import FieldPicker from '../../../shared/FieldPicker.vue';

defineProps<DeckConfigProps>();

defineEmits<{
    (e: 'update', key: string, value: any): void
}>();
</script>
