<template>
    <div class="view-config-panel">
        <!-- Header -->
        <div class="flex justify-between items-center mb-0 p-4 border-b border-gray-100 bg-white sticky top-0 z-10">
            <h2 class="text-xl font-semibold m-0 flex items-center gap-2">
                <f7-icon f7="rectangle_stack" size="24" class="text-blue-500" />
                Configure View
            </h2>
            <f7-button small color="red" outline @click="$emit('delete-view')">
                Delete View
            </f7-button>
        </div>

        <div class="p-4">
            <f7-list inset strong class="!mt-0">
                <!-- View Type Selector -->
                <f7-list-item title="View Type" smart-select :smart-select-params="{ openIn: 'popover' }">
                    <select :value="view.type" @change="updateProp('type', $event)">
                        <option value="deck">Deck View (Cards)</option>
                        <option value="table">Table View (List)</option>
                        <option value="map">Map View</option>
                        <option value="calendar">Calendar View</option>
                    </select>
                    <f7-icon slot="media" :f7="getViewIcon(view.type)" />
                </f7-list-item>

                <!-- View Title -->
                <f7-list-input label="View Title" type="text" :value="view.title"
                    @input="updateProp('title', ($event.target as HTMLInputElement).value)">
                    <f7-icon slot="media" f7="textformat" />
                </f7-list-input>

                <!-- Sort By -->
                <f7-list-item title="Sort By">
                    <template #media>
                        <f7-icon f7="arrow_up_arrow_down" />
                    </template>
                    <template #after>
                        <FieldPicker :model-value="view.sortBy ?? null" :fields="fields" :allow-none="true"
                            placeholder="Default Order"
                            @update:model-value="updateProp('sortBy', $event ?? undefined)" />
                    </template>
                </f7-list-item>

                <f7-list-item title="Sort Order" v-if="view.sortBy">
                    <f7-segmented slot="after" strong style="min-width: 120px">
                        <f7-button :active="!view.sortOrder || view.sortOrder === 'asc'"
                            @click="updateProp('sortOrder', 'asc')">Asc</f7-button>
                        <f7-button :active="view.sortOrder === 'desc'"
                            @click="updateProp('sortOrder', 'desc')">Desc</f7-button>
                    </f7-segmented>
                </f7-list-item>

                <!-- Slice Filter -->
                <f7-list-input label="Slice Filter (Values)" type="text" :value="view.slice_filter"
                    placeholder="e.g. status == 'pending'" info="Javascript expression to filter rows"
                    @input="updateProp('slice_filter', ($event.target as HTMLInputElement).value)">
                    <f7-icon slot="media" f7="funnel" />
                </f7-list-input>
            </f7-list>

            <!-- View Specific Configs -->
            <DeckViewConfig v-if="view.type === 'deck' && view.deck" :deck-config="view.deck" :fields="fields"
                @update="(k, v) => $emit('update:deckConfig', k, v)" />

            <MapViewConfig v-if="view.type === 'map' && view.map" :map-config="view.map" :fields="fields"
                @update="(k, v) => $emit('update:mapConfig', k, v)" />

            <!-- Actions Selector -->
            <ViewActionsSelector :selected-actions="view.actions || []" :available-actions="actions"
                @toggle="(id) => $emit('toggle-action', id)" />

        </div>
    </div>
</template>

<script setup lang="ts">

import type { ViewConfigPanelProps } from '../../../types/view-config.types';
import FieldPicker from '../../shared/FieldPicker.vue';
import { getViewIcon } from '../utils/viewHelpers';
import DeckViewConfig from './view-types/DeckViewConfig.vue';
import MapViewConfig from './view-types/MapViewConfig.vue';
import ViewActionsSelector from './ViewActionsSelector.vue';

defineProps<ViewConfigPanelProps>();

const emit = defineEmits<{
    (e: 'update:viewProp', key: string, value: any): void;
    (e: 'update:deckConfig', key: string, value: any): void;
    (e: 'update:mapConfig', key: string, value: any): void;
    (e: 'toggle-action', actionId: string): void;
    (e: 'delete-view'): void;
}>();

function updateProp(key: string, value: any) {
    const finalValue = (value instanceof Event) ? (value.target as HTMLSelectElement).value : value;
    emit('update:viewProp', key, finalValue);
}
</script>

<style scoped>
.view-config-panel {
    padding: 0;
    width: 100%;
    max-width: 100%;
}

/* Override Framework7 inset list constraint to allow full width usage */
:deep(.list.inset) {
    width: 100% !important;
    max-width: 100% !important;
    margin-left: 0 !important;
    margin-right: 0 !important;
}

/* Utility classes */
.flex {
    display: flex;
}

.justify-between {
    justify-content: space-between;
}

.items-center {
    align-items: center;
}

.gap-2 {
    gap: 0.5rem;
}

.m-0 {
    margin: 0;
}

.mb-6 {
    margin-bottom: 1.5rem;
}

.pb-4 {
    padding-bottom: 1rem;
}

.border-b {
    border-bottom: 1px solid;
}

.border-gray-100 {
    border-color: #f3f4f6;
}

.text-xl {
    font-size: 1.25rem;
    line-height: 1.75rem;
}

.font-semibold {
    font-weight: 600;
}

.text-blue-500 {
    color: #3b82f6;
}

.text-xs {
    font-size: 0.75rem;
}

.text-gray-500 {
    color: #6b7280;
}
</style>
