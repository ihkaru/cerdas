<template>
    <section class="views-section">
        <div class="section-header">
            <h2>Views</h2>
            <span class="count">{{ views.length }} views</span>
        </div>
        <div class="views-grid">
            <div v-for="view in views" :key="view.id" class="view-card">
                <div class="view-icon">
                    <f7-icon :f7="getViewIcon(view.type)" />
                </div>
                <div class="view-info">
                    <h3>{{ view.name }}</h3>
                    <p>{{ view.type }} view</p>
                </div>
                <div class="view-actions">
                    <f7-button small round fill color="gray" @click="$emit('edit', view.id)">Edit</f7-button>
                </div>
            </div>

            <!-- Add New View Card -->
            <div class="add-view-card" @click="$emit('create')">
                <div class="add-icon">
                    <f7-icon f7="plus" />
                </div>
                <span>Create View</span>
            </div>
        </div>
    </section>
</template>

<script setup lang="ts">
import type { AppView } from '../types/app-detail.types';

defineProps<{
    views: AppView[];
    loading: boolean;
}>();

defineEmits<{
    (e: 'create'): void;
    (e: 'edit', id: string | number): void;
}>();

function getViewIcon(type: string) {
    switch (type) {
        case 'map': return 'map';
        case 'deck': return 'rectangle_stack';
        case 'table': return 'table';
        case 'form': return 'square_pencil';
        case 'calendar': return 'calendar';
        default: return 'square_grid_2x2';
    }
}
</script>

<style scoped>
.views-section {
    margin-bottom: 32px;
}

.section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
}

.section-header h2 {
    font-size: 18px;
    font-weight: 600;
    color: #1e293b;
    margin: 0;
}

.section-header .count {
    font-size: 14px;
    color: #64748b;
}

.views-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 16px;
}

.view-card {
    background: white;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    display: flex;
    align-items: center;
    gap: 16px;
    border: 1px solid #e2e8f0;
}

.view-icon {
    width: 48px;
    height: 48px;
    border-radius: 10px;
    background: #eff6ff;
    color: #3b82f6;
    display: flex;
    align-items: center;
    justify-content: center;
}

.view-info {
    flex: 1;
}

.view-info h3 {
    margin: 0 0 4px 0;
    font-size: 16px;
    font-weight: 600;
    color: #1e293b;
}

.view-info p {
    margin: 0;
    font-size: 13px;
    color: #64748b;
    text-transform: capitalize;
}

.add-view-card {
    background: #f8fafc;
    border-radius: 12px;
    padding: 20px;
    border: 2px dashed #cbd5e1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    cursor: pointer;
    transition: all 0.2s;
    min-height: 88px;
}

.add-view-card:hover {
    border-color: #94a3b8;
    background: #f1f5f9;
}

.add-icon {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: #e2e8f0;
    color: #64748b;
    display: flex;
    align-items: center;
    justify-content: center;
}

.add-view-card span {
    font-size: 14px;
    font-weight: 500;
    color: #64748b;
}
</style>
