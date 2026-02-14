<template>
    <div class="view-renderer">
        <!-- DECK VIEW -->
        <DeckView v-if="config.type === 'deck'" :config="config" :data="viewData" :actions="actions"
            :swipe-config="swipeConfig"
            @click="(item) => handleAction(config.options?.action || config.deck?.action || 'edit', item)"
            @action="(action, item) => handleAction(action, item)" />

        <!-- MAP VIEW -->
        <MapView v-else-if="config.type === 'map'" :config="config" :data="viewData" />

        <!-- DETAIL VIEW -->
        <DetailView v-else-if="config.type === 'detail'" :config="config" :data="viewData"
            @action="(action: string, item: any) => handleAction(action, item)" />

        <!-- FORM VIEW -->
        <FormView v-else-if="config.type === 'form'" :config="config" :data="viewData" :contextId="contextId"
            @action="(action: string, item: any) => handleAction(action, item)" />

        <!-- TABLE VIEW (Fallback) -->
        <div v-else class="padding text-align-center">
            <p>Unknown View Type: {{ config.type }}</p>
        </div>
    </div>
</template>

<script setup lang="ts">
import { f7 } from 'framework7-vue'; // For navigation
import { computed } from 'vue';
import DeckView from './DeckView.vue';
import DetailView from './DetailView.vue';
import FormView from './FormView.vue';
import MapView from './MapView.vue';

const props = defineProps<{
    config: any; // The view configuration object (from layout json)
    data: any[]; // The raw data (assignments/responses)
    contextId: string; // Context
    actions?: any[]; // Available actions definition
    swipeConfig?: { left: string[]; right: string[] };
}>();

const viewData = computed(() => {
    let result = props.data || [];

    // 1. Filtering Logic
    if (props.config.filter) {
        const filters = props.config.filter;
        result = result.filter((item: any) => {
            // Check all filter conditions
            for (const key in filters) {
                const requiredValue = filters[key];

                // Handle special filter values if needed (e.g. 'me' for current user)
                // For now, simple equality check
                if (item[key] !== requiredValue) {
                    // Check if item[key] is undefined/null, handle gracefully?
                    // For now strict equality
                    return false;
                }
            }
            return true;
        });
    }

    // 2. Sorting Logic (Optional Future Enhancement)
    // if (props.config.sort) { ... }

    return result;
});

const emit = defineEmits(['action']);

const handleAction = (action: string, item: any) => {
    // 1. Navigation Actions (Internal)
    if (action === 'view_detail') {
        f7.view.main.router.navigate(`/app/${props.contextId}/view/view_detail/${item.id || item.local_id}`);
        return;
    }

    // 2. Delegate to Parent (AppShell)
    // AppShell expects { actionId, assignmentId }
    emit('action', { actionId: action, assignmentId: item.id || item.local_id });
};
</script>
