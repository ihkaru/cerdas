<template>
    <f7-sheet class="preview-sheet" :opened="opened" @sheet:closed="$emit('update:opened', false)"
        :swipe-to-close="true" :backdrop="true"
        style="height: auto; min-height: 50vh; border-top-left-radius: 16px; border-top-right-radius: 16px;">
        <div class="padding-horizontal padding-top" style="padding-bottom: 20px;">
            <div class="display-flex justify-content-between align-items-center margin-bottom">
                <div class="preview-title no-margin">{{ title }}</div>
                <f7-link icon-f7="multiply_circle_fill" color="gray" @click="$emit('update:opened', false)"></f7-link>
            </div>

            <div class="preview-card" style="margin-bottom: 16px;">
                <!-- ID / Key Info -->
                <div class="preview-row">
                    <span class="preview-label">ID</span>
                    <span class="preview-value text-color-gray" style="font-size: 12px">{{ assignment?.external_id ||
                        assignment?.id }}</span>
                </div>
                <div class="preview-row">
                    <span class="preview-label">Status</span>
                    <f7-chip :text="statusLabel(assignment?.status || 'assigned')"
                        :color="statusChipColor(assignment?.status || 'assigned')" outline></f7-chip>
                </div>
            </div>

            <!-- Preview Fields -->
            <div v-if="filledFields.length > 0" class="preview-card" style="margin-top: 12px;">
                <div class="preview-row" v-for="field in filledFields" :key="field.name">
                    <span class="preview-label">{{ field.displayName || field.label }}</span>
                    <span class="preview-value">{{ getPreviewValue(field.name) }}</span>
                </div>
            </div>
        </div>

        <!-- Fixed Button at Bottom -->
        <div style="padding: 0 16px 16px 16px;">
            <f7-button large fill color="blue" @click="handleOpen">
                <f7-icon f7="doc_text" class="margin-right-half"></f7-icon>
                Buka Form
            </f7-button>
        </div>
    </f7-sheet>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { statusChipColor, statusLabel } from '../utils/statusHelpers';

const props = defineProps<{
    opened: boolean;
    assignment: any;
    previewFields: any[];
    response: Record<string, any>;
}>();

const emit = defineEmits<{
    (e: 'update:opened', value: boolean): void;
    (e: 'open-form', id: string): void;
}>();

const title = computed(() => {
    return props.assignment?.prelist_data?.name || 'Assignment Preview';
});

const filledFields = computed(() => {
    if (!props.assignment) return [];
    return props.previewFields.filter((f: any) => {
        // Check prelist
        const preVal = props.assignment.prelist_data?.[f.name];
        if (preVal !== undefined && preVal !== null && preVal !== '') return true;
        // Check response
        const resVal = props.response?.[f.name];
        if (resVal !== undefined && resVal !== null && resVal !== '') return true;
        return false;
    });
});

const getPreviewValue = (fieldName: string) => {
    if (!props.assignment) return '-';
    // User response takes precedence
    const responseValue = props.response?.[fieldName];
    if (responseValue !== undefined && responseValue !== null && responseValue !== '') return String(responseValue);
    // Fallback to prelist
    const prelistValue = props.assignment.prelist_data?.[fieldName];
    if (prelistValue !== undefined && prelistValue !== null) return String(prelistValue);
    return '-';
};

const handleOpen = () => {
    if (props.assignment) {
        // Emit event to parent to handle navigation, but first close sheet
        emit('update:opened', false);
        // Small timeout to allow sheet to close before nav (handled by parent usually, but emit immediate is fine)
        emit('open-form', props.assignment.id);
    }
}
</script>

<style scoped>
.preview-title {
    margin: 0;
    color: var(--f7-theme-color);
    font-size: 20px;
    font-weight: 600;
}

.preview-card {
    background: #f5f5f5;
    border-radius: 8px;
    padding: 12px;
}

.preview-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
    border-bottom: 1px solid #e0e0e0;
}

.preview-row:last-child {
    border-bottom: none;
}

.preview-label {
    color: #666;
    font-size: 14px;
    flex-shrink: 0;
}

.preview-value {
    color: #333;
    font-size: 14px;
    font-weight: 500;
    text-align: right;
}
</style>
