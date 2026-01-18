<template>
    <a :href="`/forms/${form.id}`" class="form-card">
        <div class="form-icon" :class="form.status">
            <f7-icon :f7="form.icon" />
        </div>
        <div class="form-info">
            <h3>{{ form.name }}</h3>
            <p>{{ form.description }}</p>
        </div>
        <div class="form-meta">
            <span class="status-badge" :class="form.status">{{ form.status }}</span>
            <span class="version">v{{ form.version }}</span>
        </div>
        <div class="form-stats">
            <div class="stat">
                <f7-icon f7="square_list" />
                <span>{{ form.fieldCount }} fields</span>
            </div>
            <div class="stat">
                <f7-icon f7="doc_on_clipboard" />
                <span>{{ form.responseCount }} responses</span>
            </div>
        </div>
    </a>
</template>
<script setup lang="ts">
import { f7Icon } from 'framework7-vue';
import type { AppForm } from '../types/app-detail.types';

defineProps<{
    form: AppForm;
}>();
</script>
<style scoped>
.form-card {
    background: white;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    transition: all 0.2s;
    border: 1px solid transparent;
    text-decoration: none;
    display: block;
}

.form-card:hover {
    border-color: #2563eb;
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.15);
}

.form-icon {
    width: 44px;
    height: 44px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 12px;
}

.form-icon.published {
    background: #dcfce7;
    color: #16a34a;
}

.form-icon.draft {
    background: #fef3c7;
    color: #d97706;
}

.form-icon :deep(.icon) {
    font-size: 20px;
}

.form-info h3 {
    font-size: 16px;
    font-weight: 600;
    color: #1e293b;
    margin: 0 0 4px 0;
}

.form-info p {
    font-size: 13px;
    color: #64748b;
    margin: 0;
    line-height: 1.4;
}

.form-meta {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-top: 12px;
}

.status-badge {
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 500;
    text-transform: capitalize;
}

.status-badge.published {
    background: #dcfce7;
    color: #16a34a;
}

.status-badge.draft {
    background: #fef3c7;
    color: #d97706;
}

.version {
    font-size: 12px;
    color: #64748b;
}

.form-stats {
    display: flex;
    gap: 16px;
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid #f1f5f9;
}

.stat {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: #64748b;
}

.stat :deep(.icon) {
    font-size: 14px;
}
</style>
