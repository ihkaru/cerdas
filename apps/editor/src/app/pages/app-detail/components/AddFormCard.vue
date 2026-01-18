<template>
    <div class="form-card add-card" @click="$emit('click')">
        <div class="add-icon">
            <f7-icon f7="doc_badge_plus" />
        </div>
        <span>Add New Form</span>
        <p>Create a new data collection form</p>
    </div>
</template>
<script setup lang="ts">
import { f7Icon } from 'framework7-vue';
defineEmits<{ (e: 'click'): void }>();
</script>
<style scoped>
.add-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border: 2px dashed #e2e8f0;
    background: transparent;
    min-height: 180px;
    cursor: pointer;
    text-align: center;
}

.add-card:hover {
    border-color: #2563eb;
    background: #f8fafc;
}

.add-icon {
    color: #94a3b8;
    margin-bottom: 12px;
}

.add-icon :deep(.icon) {
    font-size: 32px;
}

.add-card>span {
    font-size: 14px;
    font-weight: 500;
    color: #1e293b;
}

.add-card>p {
    font-size: 12px;
    color: #64748b;
    margin-top: 4px;
}
</style>
