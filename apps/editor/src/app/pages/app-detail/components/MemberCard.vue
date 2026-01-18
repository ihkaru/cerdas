<template>
    <div class="member-card">
        <div class="member-avatar" :style="{ background: member.color }">
            {{ member.initials }}
        </div>
        <div class="member-info">
            <span class="name">{{ member.name }}</span>
            <span class="role">{{ member.role }}</span>
        </div>
    </div>
</template>
<script setup lang="ts">
import type { AppMember } from '../types/app-detail.types';

defineProps<{
    member: AppMember;
}>();
</script>
<style scoped>
.member-card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    background: #f8fafc;
    border-radius: 8px;
}

.member-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 13px;
    font-weight: 600;
}

.member-info .name {
    display: block;
    font-size: 14px;
    font-weight: 500;
    color: #1e293b;
}

.member-info .role {
    display: block;
    font-size: 12px;
    color: #64748b;
}
</style>
