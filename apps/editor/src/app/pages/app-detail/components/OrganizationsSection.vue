<template>
    <section class="org-section">
        <div class="section-header">
            <h2>Participating Organizations</h2>
            <f7-button outline small @click="$emit('add')">
                <f7-icon f7="building_2_fill" />
                Add Organization
            </f7-button>
        </div>
        <div class="org-grid">
            <div v-for="org in organizations" :key="org.id" class="org-card">
                <div class="org-icon">
                    <f7-icon f7="building_2_fill" size="24" color="blue" />
                </div>
                <div class="org-info">
                    <div class="org-name">{{ org.name }}</div>
                    <div class="org-code">{{ org.code }}</div>
                </div>
                <f7-button small color="red" @click="$emit('remove', org.id)">
                    <f7-icon f7="trash" size="16" />
                </f7-button>
            </div>

            <div v-if="organizations.length === 0" class="empty-state">
                No organizations attached yet.
            </div>
        </div>
    </section>
</template>

<script setup lang="ts">
import { f7Button, f7Icon } from 'framework7-vue';
import type { AppOrganization } from '../types/app-detail.types';

defineProps<{
    organizations: AppOrganization[];
    loading: boolean;
}>();

defineEmits(['add', 'remove']);
</script>

<style scoped>
.org-section {
    background: white;
    border-radius: 12px;
    padding: 24px;
    margin-top: 24px;
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

.org-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 12px;
}

.org-card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
    background: #f8fafc;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
}

.org-icon {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    background: #eff6ff;
    display: flex;
    align-items: center;
    justify-content: center;
}

.org-info {
    flex: 1;
}

.org-name {
    font-weight: 600;
    font-size: 14px;
    color: #0f172a;
}

.org-code {
    font-size: 12px;
    color: #64748b;
}

.empty-state {
    grid-column: 1 / -1;
    text-align: center;
    padding: 24px;
    color: #94a3b8;
    background: #f8fafc;
    border-radius: 8px;
    border: 1px dashed #cbd5e1;
}
</style>
