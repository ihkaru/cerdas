<template>
    <f7-block-title medium class="display-flex justify-content-between align-items-center margin-top">
        <span>Tasks</span>
        <f7-chip :text="`${totalCount || assignments.length}`" class="bg-color-gray-200 text-color-black"></f7-chip>
    </f7-block-title>

    <div v-if="loading" class="padding">
        <f7-skeleton-block style="height: 100px; border-radius: 8px;" class="margin-bottom"></f7-skeleton-block>
        <f7-skeleton-block style="height: 100px; border-radius: 8px;" class="margin-bottom"></f7-skeleton-block>
    </div>

    <f7-list v-else media-list strong-ios dividers-ios inset-ios class="assignment-list no-margin-top">
        <f7-list-item v-for="assignment in assignments" :key="assignment.id" swipeout link="#" no-chevron
            class="no-ripple" @click.prevent="$emit('open-assignment', assignment.id)"
            :title="assignment.prelist_data?.name || 'Unnamed'"
            :subtitle="!assignment.enumerator_id ? 'Unassigned / Open' : (assignment.external_id || 'TASK')"
            :text="assignment.prelist_data?.address || 'No Address'">
            <!-- Status Indicator -->
            <template #media>
                <div class="status-dot" :class="`bg-color-${statusColor(assignment.status)}`"></div>
            </template>
            <template #after>
                <f7-badge v-if="!assignment.enumerator_id" color="blue">OPEN</f7-badge>
            </template>

            <!-- Swipe Left Actions (revealed when swiping RIGHT) -->
            <f7-swipeout-actions left>
                <f7-swipeout-button color="green" @click="emitRowAction('complete', assignment.id)">
                    <f7-icon f7="checkmark_circle" />
                </f7-swipeout-button>
            </f7-swipeout-actions>

            <!-- Swipe Right Actions (revealed when swiping LEFT) -->
            <f7-swipeout-actions right>
                <f7-swipeout-button color="orange" @click="emitRowAction('duplicate', assignment.id)">
                    <f7-icon f7="doc_on_doc" />
                </f7-swipeout-button>
                <f7-swipeout-button color="red" @click="emitRowAction('delete', assignment.id)">
                    <f7-icon f7="trash" />
                </f7-swipeout-button>
            </f7-swipeout-actions>
        </f7-list-item>
    </f7-list>

    <div v-if="!loading && assignments.length > 0 && (totalCount || 0) > assignments.length"
        class="text-align-center padding text-color-gray size-12">
        Showing {{ assignments.length }} of {{ totalCount }} tasks
    </div>

    <div v-if="!loading && assignments.length === 0" class="text-align-center padding-xl">
        <f7-icon f7="checkmark_circle" size="64" color="gray" class="opacity-30 margin-bottom"></f7-icon>
        <p class="text-color-gray">No pending tasks.</p>
        <f7-button tonality="tonal" round small @click="$emit('sync-request')" class="display-inline-block width-auto">
            Check for new tasks
        </f7-button>
    </div>

    <div class="height-50"></div>
</template>

<script setup lang="ts">
import type { Assignment } from '../types';

const props = defineProps<{
    assignments: Assignment[];
    totalCount?: number;
    loading: boolean;
    rowActions?: any[];
    swipeConfig?: { left: string[]; right: string[] };
}>();

const emit = defineEmits<{
    (e: 'open-assignment', id: string): void;
    (e: 'sync-request'): void;
    (e: 'row-action', payload: { actionId: string; assignmentId: string }): void;
}>();

const statusColor = (status: string) => {
    switch (status) {
        case 'completed': return 'green';
        case 'in_progress': return 'blue';
        case 'synced': return 'teal';
        default: return 'gray';
    }
};

// Emit row action
const emitRowAction = (actionId: string, assignmentId: string) => {
    emit('row-action', { actionId, assignmentId });
};
</script>

<style scoped>
.assignment-list :deep(.item-content) {
    padding-left: 0;
}

.status-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    margin-left: 16px;
}

.height-50 {
    height: 50px;
}
</style>
