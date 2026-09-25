<template>
    <section class="org-section">
        <div class="section-header">
            <div class="section-title-wrap">
                <h2>Participating Organizations</h2>
                <span class="count-badge" v-if="organizations.length > 0">{{ organizations.length }}</span>
            </div>
            <f7-button outline small @click="$emit('add')" class="add-org-btn">
                <f7-icon f7="building_2_fill" size="14" class="margin-right-half" />
                Add Organization
            </f7-button>
        </div>
        <div class="org-grid">
            <div v-for="org in organizations" :key="org.id" class="org-card">
                <div class="org-icon">
                    <f7-icon f7="building_2_fill" size="20" color="blue" />
                </div>
                <div class="org-info">
                    <div class="org-name" :title="org.name">{{ org.name }}</div>
                    <div class="org-code">Kode: {{ org.code }}</div>
                </div>
                <button class="btn-remove-org" @click="$emit('remove', org.id)" title="Hapus Organisasi">
                    <f7-icon f7="trash" size="13" />
                </button>
            </div>

            <div v-if="organizations.length === 0" class="empty-org-state">
                <div class="empty-icon-wrap">
                    <f7-icon f7="building_2_fill" size="24" />
                </div>
                <div class="empty-text">
                    <p class="empty-title">Belum ada organisasi yang terhubung</p>
                    <p class="empty-sub">Hubungkan unit kerja atau dinas untuk mendistribusikan survei ini secara multi-organisasi.</p>
                </div>
                <f7-button fill small @click="$emit('add')" class="empty-add-btn">
                    <f7-icon f7="plus" size="12" class="margin-right-half" />
                    Tambah Organisasi
                </f7-button>
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

defineEmits<{
    (e: 'add'): void;
    (e: 'remove', id: string | number): void;
}>();
</script>

<style scoped>
.org-section {
    background: #ffffff;
    border-radius: 12px;
    padding: 24px;
    margin-top: 24px;
    border: 1px solid #e2e8f0;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
}

.section-title-wrap {
    display: flex;
    align-items: center;
    gap: 8px;
}

.section-header h2 {
    font-size: 18px;
    font-weight: 600;
    color: #1e293b;
    margin: 0;
}

.count-badge {
    font-size: 11px;
    font-weight: 600;
    background: #e2e8f0;
    color: #475569;
    padding: 2px 7px;
    border-radius: 12px;
}

.add-org-btn {
    --f7-button-text-color: #2563eb;
    --f7-button-border-color: #bfdbfe;
    border-radius: 8px;
    font-weight: 500;
    height: 32px;
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
    padding: 12px 14px;
    background: #f8fafc;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
    transition: all 0.15s ease;
    min-width: 0;
}

.org-card:hover {
    background: #ffffff;
    border-color: #cbd5e1;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

.org-icon {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    background: #eff6ff;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.org-info {
    flex: 1;
    min-width: 0;
}

.org-name {
    font-weight: 600;
    font-size: 13.5px;
    color: #0f172a;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.org-code {
    font-size: 11.5px;
    color: #64748b;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.btn-remove-org {
    all: unset;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    border-radius: 5px;
    color: #94a3b8;
    flex-shrink: 0;
    opacity: 0.6;
    transition: all 0.15s ease;
}

.org-card:hover .btn-remove-org {
    opacity: 1;
}

.btn-remove-org:hover {
    background: #fef2f2;
    color: #dc2626;
}

.empty-org-state {
    grid-column: 1 / -1;
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 20px;
    background: #f8fafc;
    border: 1px dashed #cbd5e1;
    border-radius: 8px;
}

.empty-icon-wrap {
    width: 44px;
    height: 44px;
    border-radius: 8px;
    background: #eff6ff;
    color: #2563eb;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.empty-text {
    flex: 1;
}

.empty-title {
    font-size: 14px;
    font-weight: 600;
    color: #1e293b;
    margin: 0 0 2px 0;
}

.empty-sub {
    font-size: 12.5px;
    color: #64748b;
    margin: 0;
}

.empty-add-btn {
    --f7-button-bg-color: #2563eb;
    border-radius: 6px;
    font-weight: 500;
    flex-shrink: 0;
}
</style>
