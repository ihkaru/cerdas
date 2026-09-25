<template>
    <div class="member-card">
        <div class="member-avatar" :style="{ background: member.color || '#2563eb' }">
            {{ member.initials || 'U' }}
        </div>
        <div class="member-info">
            <span class="member-name" :title="member.name">{{ member.name }}</span>
            <span class="member-role-badge" :class="member.role">{{ member.role }}</span>
        </div>
        <button
            class="member-remove-btn"
            @click.stop="$emit('remove', member.id)"
            title="Hapus Anggota"
        >
            <f7-icon f7="trash" size="13" />
        </button>
    </div>
</template>

<script setup lang="ts">
import type { AppMember } from '../types/app-detail.types';

defineProps<{
    member: AppMember;
}>();

defineEmits<{
    (e: 'remove', id: string | number): void;
}>();
</script>

<style scoped>
.member-card {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    transition: all 0.15s ease;
    min-width: 0;
}

.member-card:hover {
    background: #ffffff;
    border-color: #cbd5e1;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

.member-avatar {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 12px;
    font-weight: 600;
    flex-shrink: 0;
}

.member-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.member-name {
    font-size: 13px;
    font-weight: 500;
    color: #1e293b;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.member-role-badge {
    display: inline-block;
    font-size: 10.5px;
    font-weight: 600;
    text-transform: capitalize;
    color: #64748b;
}

.member-role-badge.owner {
    color: #2563eb;
}

.member-role-badge.admin {
    color: #7c3aed;
}

.member-remove-btn {
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

.member-card:hover .member-remove-btn {
    opacity: 1;
}

.member-remove-btn:hover {
    background: #fef2f2;
    color: #dc2626;
}
</style>
