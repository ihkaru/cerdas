<template>
    <div class="map-config">
        <f7-block-title>Map Configuration</f7-block-title>
        <f7-list inset strong>
            <f7-list-item>
                <template #title>Latitude Field</template>
                <template #after>
                    <FieldPicker :model-value="mapConfig.lat" :fields="fields" :allow-none="false"
                        :filter-types="['gps']" placeholder="Select GPS field..."
                        @update:model-value="$emit('update', 'lat', $event)" />
                </template>
            </f7-list-item>
            <f7-list-item>
                <template #title>Longitude Field</template>
                <template #after>
                    <FieldPicker :model-value="mapConfig.long" :fields="fields" :allow-none="false"
                        :filter-types="['gps']" placeholder="Select GPS field..."
                        @update:model-value="$emit('update', 'long', $event)" />
                </template>
            </f7-list-item>
            <f7-list-item>
                <template #title>Label Field</template>
                <template #after>
                    <FieldPicker :model-value="mapConfig.label" :fields="fields" :allow-none="true"
                        placeholder="Field for pin label..." @update:model-value="$emit('update', 'label', $event)" />
                </template>
            </f7-list-item>
        </f7-list>
    </div>
</template>

<script setup lang="ts">

import type { MapConfigProps } from '../../../../types/view-config.types';
import FieldPicker from '../../../shared/FieldPicker.vue';

defineProps<MapConfigProps>();

defineEmits<{
    (e: 'update', key: string, value: any): void
}>();
</script>
