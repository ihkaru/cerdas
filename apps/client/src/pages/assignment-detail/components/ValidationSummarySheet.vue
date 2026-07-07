<template>
    <f7-sheet class="validation-sheet app-sheet" :opened="opened" @sheet:closed="$emit('close')"
        swipe-to-close backdrop style="height: auto; max-height: 75vh;">

        <!-- Drag Handle -->
        <div class="sheet-drag-handle"></div>

        <!-- Proper toolbar (was missing before) -->
        <f7-toolbar class="sheet-toolbar" no-shadow>
            <div class="left"></div>
            <div class="center">
                <span class="sheet-title">Ringkasan Validasi</span>
            </div>
            <div class="right">
                <f7-link @click="$emit('close')" class="sheet-done-btn">Tutup</f7-link>
            </div>
        </f7-toolbar>

        <div class="validation-scroll">

            <!-- All Good -->
            <div v-if="badgeCount === 0" class="validation-all-good">
                <f7-icon f7="checkmark_seal_fill" size="56" color="green"></f7-icon>
                <p>Semua field terisi dengan benar!</p>
            </div>

            <!-- Errors -->
            <div v-if="summary.errors.length > 0" class="validation-section">
                <div class="validation-header validation-header--error">
                    <f7-icon f7="xmark_circle_fill" size="15"></f7-icon>
                    <span>Errors ({{ summary.errors.length }})</span>
                </div>
                <div class="validation-items">
                    <div v-for="item in summary.errors" :key="item.fieldName" class="validation-item"
                        @click="$emit('scroll-to-field', item.fieldName)">
                        <span class="item-label">{{ item.label }}</span>
                        <span class="item-message item-message--error">{{ item.message }}</span>
                    </div>
                </div>
            </div>

            <!-- Warnings -->
            <div v-if="summary.warnings.length > 0" class="validation-section">
                <div class="validation-header validation-header--warning">
                    <f7-icon f7="exclamationmark_triangle_fill" size="15"></f7-icon>
                    <span>Warnings ({{ summary.warnings.length }})</span>
                </div>
                <div class="validation-items">
                    <div v-for="item in summary.warnings" :key="item.fieldName" class="validation-item"
                        @click="$emit('scroll-to-field', item.fieldName)">
                        <span class="item-label">{{ item.label }}</span>
                        <span class="item-message item-message--warning">{{ item.message }}</span>
                    </div>
                </div>
            </div>

            <!-- Blanks -->
            <div v-if="summary.blanks.length > 0" class="validation-section">
                <div class="validation-header validation-header--blank">
                    <f7-icon f7="pencil_slash" size="15"></f7-icon>
                    <span>Belum Diisi ({{ summary.blanks.length }})</span>
                </div>
                <div class="validation-items">
                    <div v-for="item in summary.blanks" :key="item.fieldName" class="validation-item"
                        @click="$emit('scroll-to-field', item.fieldName)">
                        <span class="item-label">{{ item.label }}</span>
                        <span class="item-message item-message--blank">{{ item.message }}</span>
                    </div>
                </div>
            </div>

            <div class="validation-bottom-safe"></div>
        </div>
    </f7-sheet>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { ValidationSummary } from '../composables/useValidationSummary';

const props = defineProps<{
    opened: boolean;
    summary: ValidationSummary;
}>();

defineEmits<{
    (e: 'close'): void;
    (e: 'scroll-to-field', fieldName: string): void;
}>();

const badgeCount = computed(() => {
    return props.summary.errors.length +
        props.summary.warnings.length +
        props.summary.blanks.length;
});
</script>

<style scoped>
.validation-scroll {
    overflow-y: auto;
    max-height: calc(75vh - 52px - 24px); /* sheet - toolbar - drag handle */
    padding: 12px 16px;
}

/* All Good state */
.validation-all-good {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    padding: 32px 16px;
    text-align: center;
}

.validation-all-good p {
    margin: 0;
    font-size: 15px;
    font-weight: 600;
    color: #16a34a;
}

/* Sections */
.validation-section {
    margin-bottom: 12px;
    border-radius: 10px;
    overflow: hidden;
    border: 1px solid rgba(0, 0, 0, 0.06);
}

.validation-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    font-weight: 600;
    font-size: 13px;
    color: white;
}

.validation-header--error   { background: #dc2626; }
.validation-header--warning { background: #d97706; }
.validation-header--blank   { background: #64748b; }

.validation-items {
    background: #fafafa;
}

.validation-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 11px 12px;
    border-bottom: 1px solid #f1f5f9;
    cursor: pointer;
    transition: background 0.12s;
}

.validation-item:last-child {
    border-bottom: none;
}

.validation-item:active {
    background: #f1f5f9;
}

.item-label {
    font-weight: 500;
    font-size: 14px;
    color: #1e293b;
}

.item-message {
    font-size: 12px;
    max-width: 50%;
    text-align: right;
}

.item-message--error   { color: #dc2626; }
.item-message--warning { color: #d97706; }
.item-message--blank   { color: #94a3b8; }

.validation-bottom-safe {
    height: env(safe-area-inset-bottom, 16px);
}
</style>
