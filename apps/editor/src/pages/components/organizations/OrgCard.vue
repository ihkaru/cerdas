<template>
    <div class="org-card" :class="{ public: isPublic }" @click="$emit('select', org)">
        <div class="org-card-header">
            <div class="org-avatar" :class="{ teal: isPublic }">
                <f7-icon f7="building_2_fill" size="20" />
            </div>
            <div class="org-card-badge">
                <span class="badge-role" :class="isPublic ? 'public' : 'owner'">
                    {{ isPublic ? 'Public' : 'Owner' }}
                </span>
            </div>
        </div>
        <div class="org-card-body">
            <h3 class="org-name" :title="org.name">{{ org.name }}</h3>
            <div class="org-meta">
                <span class="code-badge">Kode: {{ org.code }}</span>
                <span v-if="org.members_count" class="members-count">
                    <f7-icon f7="person_2" size="12" />
                    {{ org.members_count }} anggota
                </span>
            </div>
        </div>
        <div class="org-card-footer">
            <button class="btn-manage" @click.stop="$emit('select', org)">
                <f7-icon :f7="isPublic ? 'eye' : 'gear'" size="13" />
                <span>{{ isPublic ? 'Lihat Detail' : 'Kelola & Anggota' }}</span>
            </button>
            <button
                v-if="!isPublic"
                class="btn-delete"
                @click.stop="$emit('delete', org)"
                title="Hapus Organisasi"
            >
                <f7-icon f7="trash" size="13" />
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { OrganizationItem } from './organizations.types';

const props = defineProps<{
    org: OrganizationItem;
    currentUserId?: string | number;
}>();

defineEmits<{
    (e: 'select', org: OrganizationItem): void;
    (e: 'delete', org: OrganizationItem): void;
}>();

const isPublic = computed(() => {
    return props.org.creator_id !== props.currentUserId;
});
</script>

<style scoped>
.org-card {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 16px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    cursor: pointer;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    transition: all 0.15s ease;
    min-height: 180px;
}

.org-card:hover {
    border-color: #2563eb;
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.08);
    transform: translateY(-1px);
}

.org-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
}

.org-avatar {
    width: 38px;
    height: 38px;
    border-radius: 8px;
    background: #eff6ff;
    color: #2563eb;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.org-avatar.teal {
    background: #ccfbf1;
    color: #0d9488;
}

.badge-role {
    font-size: 11px;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 6px;
}

.badge-role.owner {
    background: #eff6ff;
    color: #2563eb;
    border: 1px solid #bfdbfe;
}

.badge-role.public {
    background: #f1f5f9;
    color: #64748b;
    border: 1px solid #e2e8f0;
}

.org-card-body {
    flex: 1;
    min-width: 0;
}

.org-name {
    font-size: 15px;
    font-weight: 600;
    color: #1e293b;
    margin: 0 0 6px 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.org-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
}

.code-badge {
    font-family: monospace;
    font-size: 11px;
    font-weight: 600;
    background: #f8fafc;
    color: #475569;
    padding: 1px 6px;
    border-radius: 4px;
    border: 1px solid #e2e8f0;
}

.members-count {
    color: #64748b;
    display: flex;
    align-items: center;
    gap: 4px;
}

.org-card-footer {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 14px;
    padding-top: 12px;
    border-top: 1px solid #f1f5f9;
}

.btn-manage {
    all: unset;
    cursor: pointer;
    flex: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    height: 30px;
    padding: 0 10px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 500;
    background: #f8fafc;
    color: #334155;
    border: 1px solid #e2e8f0;
    transition: all 0.15s ease;
}

.btn-manage:hover {
    background: #eff6ff;
    border-color: #bfdbfe;
    color: #2563eb;
}

.btn-delete {
    all: unset;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    border-radius: 6px;
    color: #94a3b8;
    transition: all 0.15s ease;
}

.btn-delete:hover {
    background: #fef2f2;
    color: #dc2626;
}
</style>
