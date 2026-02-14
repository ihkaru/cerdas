<template>
    <f7-sheet :opened="opened" @sheet:closed="$emit('close')" swipe-to-close backdrop
        style="height: auto; --f7-sheet-height: auto; max-height: 70vh;">
        <div class="swipe-handler"></div>
        <div style="max-height: 60vh; overflow-y: auto; padding: 16px;">
            <h2 style="margin: 0 0 16px 0;">Ringkasan Validasi</h2>

            <!-- Errors -->
            <div v-if="summary.errors.length > 0" class="validation-section">
                <div class="validation-header bg-color-red text-color-white">
                    <f7-icon f7="xmark_circle_fill" size="16"></f7-icon>
                    <span>Errors ({{ summary.errors.length }})</span>
                </div>
                <div class="validation-items">
                    <div v-for="item in summary.errors" :key="item.fieldName" class="validation-item"
                        @click="$emit('scroll-to-field', item.fieldName)">
                        <span class="item-label">{{ item.label }}</span>
                        <span class="item-message text-color-red">{{ item.message }}</span>
                    </div>
                </div>
            </div>

            <!-- Warnings -->
            <div v-if="summary.warnings.length > 0" class="validation-section">
                <div class="validation-header bg-color-orange text-color-white">
                    <f7-icon f7="exclamationmark_triangle_fill" size="16"></f7-icon>
                    <span>Warnings ({{ summary.warnings.length }})</span>
                </div>
                <div class="validation-items">
                    <div v-for="item in summary.warnings" :key="item.fieldName" class="validation-item"
                        @click="$emit('scroll-to-field', item.fieldName)">
                        <span class="item-label">{{ item.label }}</span>
                        <span class="item-message text-color-orange">{{ item.message }}</span>
                    </div>
                </div>
            </div>

            <!-- Blanks -->
            <div v-if="summary.blanks.length > 0" class="validation-section">
                <div class="validation-header blank-header">
                    <f7-icon f7="pencil_slash" size="16"></f7-icon>
                    <span>Belum Diisi ({{ summary.blanks.length }})</span>
                </div>
                <div class="validation-items">
                    <div v-for="item in summary.blanks" :key="item.fieldName" class="validation-item"
                        @click="$emit('scroll-to-field', item.fieldName)">
                        <span class="item-label">{{ item.label }}</span>
                        <span class="item-message text-color-gray">{{ item.message }}</span>
                    </div>
                </div>
            </div>

            <!-- All Good -->
            <div v-if="badgeCount === 0" class="text-align-center padding-xl">
                <f7-icon f7="checkmark_seal_fill" size="64" color="green"></f7-icon>
                <p class="text-color-green font-weight-bold">Semua field terisi dengan benar!</p>
            </div>
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
.validation-section {
    margin-bottom: 16px;
    border-radius: 8px;
    overflow: hidden;
}

.validation-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    font-weight: 600;
    font-size: 14px;
}

.validation-items {
    background: #f5f5f5;
}

.validation-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px;
    border-bottom: 1px solid #e0e0e0;
    cursor: pointer;
}

.validation-item:last-child {
    border-bottom: none;
}

.validation-item:active {
    background: #e8e8e8;
}

.item-label {
    font-weight: 500;
    font-size: 14px;
}

.item-message {
    font-size: 12px;
    max-width: 50%;
    text-align: right;
}

.blank-header {
    background-color: #555;
    color: white;
}
</style>
