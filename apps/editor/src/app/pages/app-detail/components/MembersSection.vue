<template>
    <section class="members-section">
        <div class="section-header">
            <h2>Team Members</h2>
            <f7-button outline small>
                <f7-icon f7="person_badge_plus" />
                Invite
            </f7-button>
        </div>
        <div class="members-grid">
            <MemberCard v-for="member in members" :key="member.id" :member="member" />

            <!-- Skeleton Members -->
            <div v-if="loading && members.length === 0" v-for="i in 4" :key="'skel-mem-' + i"
                class="member-card skeleton-text skeleton-effect-wave">
                <div class="member-avatar skeleton-block" style="background: rgba(0,0,0,0.1)"></div>
                <div class="member-info" style="width: 100%">
                    <div class="skeleton-block"
                        style="width: 70%; height: 14px; margin-bottom: 4px; border-radius: 4px"></div>
                    <div class="skeleton-block" style="width: 40%; height: 10px; border-radius: 4px"></div>
                </div>
            </div>
        </div>
    </section>
</template>
<script setup lang="ts">
import { f7Button, f7Icon } from 'framework7-vue';
import type { AppMember } from '../types/app-detail.types';
import MemberCard from './MemberCard.vue';

defineProps<{
    members: AppMember[];
    loading: boolean;
}>();
</script>
<style scoped>
.members-section {
    background: white;
    border-radius: 12px;
    padding: 24px;
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

.members-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 12px;
}

/* Skeleton styles */
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
}
</style>
