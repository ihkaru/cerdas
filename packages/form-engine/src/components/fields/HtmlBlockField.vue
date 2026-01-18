<template>
    <!-- HTML Block - renders static HTML content for instructions, notes, etc -->
    <div class="html-block" :class="blockClass">
        <div v-if="field.label" class="html-block-title">{{ field.label }}</div>
        <div class="html-block-content" v-html="sanitizedContent"></div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { FieldDefinition } from '../../types/schema';

const props = defineProps<{
    field: FieldDefinition;
    value?: any;
    error?: string | null;
}>();

// Compute block style class from field config
const blockClass = computed(() => {
    const style = props.field.blockStyle || 'default';
    return `html-block--${style}`;
});

// Basic sanitization - allow safe HTML tags only
// For production, consider using DOMPurify
const sanitizedContent = computed(() => {
    const content = props.field.content || props.field.placeholder || '';
    // Allow basic formatting tags, remove scripts and dangerous attributes
    return content
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/on\w+="[^"]*"/gi, '')
        .replace(/javascript:/gi, '');
});
</script>

<style scoped>
.html-block {
    padding: 12px 16px;
    margin: 8px 0;
    border-radius: 8px;
}

.html-block--default {
    background: #f8f9fa;
    border-left: 3px solid #6c757d;
}

.html-block--info {
    background: #e7f3ff;
    border-left: 3px solid #0d6efd;
}

.html-block--warning {
    background: #fff3cd;
    border-left: 3px solid #ffc107;
}

.html-block--success {
    background: #d1e7dd;
    border-left: 3px solid #198754;
}

.html-block--danger {
    background: #f8d7da;
    border-left: 3px solid #dc3545;
}

.html-block--note {
    background: #f0f4f8;
    border: 1px dashed #adb5bd;
    border-left: 3px solid #6c757d;
}

.html-block-title {
    font-weight: 600;
    font-size: 14px;
    margin-bottom: 6px;
    color: #343a40;
}

.html-block-content {
    font-size: 14px;
    line-height: 1.5;
    color: #495057;
}

.html-block-content :deep(h1),
.html-block-content :deep(h2),
.html-block-content :deep(h3) {
    margin: 8px 0 4px 0;
    font-weight: 600;
}

.html-block-content :deep(h1) {
    font-size: 18px;
}

.html-block-content :deep(h2) {
    font-size: 16px;
}

.html-block-content :deep(h3) {
    font-size: 14px;
}

.html-block-content :deep(p) {
    margin: 4px 0;
}

.html-block-content :deep(ul),
.html-block-content :deep(ol) {
    margin: 4px 0;
    padding-left: 20px;
}

.html-block-content :deep(li) {
    margin: 2px 0;
}

.html-block-content :deep(strong),
.html-block-content :deep(b) {
    font-weight: 600;
}

.html-block-content :deep(em),
.html-block-content :deep(i) {
    font-style: italic;
}

.html-block-content :deep(code) {
    background: rgba(0, 0, 0, 0.05);
    padding: 2px 6px;
    border-radius: 4px;
    font-family: monospace;
    font-size: 13px;
}

.html-block-content :deep(a) {
    color: #0d6efd;
    text-decoration: underline;
}

.html-block-content :deep(table) {
    width: 100%;
    border-collapse: collapse;
    margin: 8px 0;
    font-size: 13px;
}

.html-block-content :deep(th),
.html-block-content :deep(td) {
    border: 1px solid #dee2e6;
    padding: 6px 8px;
    text-align: left;
}

.html-block-content :deep(th) {
    background: #f8f9fa;
    font-weight: 600;
}
</style>
