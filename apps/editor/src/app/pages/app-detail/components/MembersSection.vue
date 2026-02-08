<template>
    <section class="members-section">
        <div class="section-header">
            <h2>Team Members</h2>
            <f7-button outline small @click="$emit('invite')">
                <f7-icon f7="person_badge_plus" />
                Invite
            </f7-button>
        </div>
        
        <!-- Existing Members -->
        <div class="members-grid" v-if="members.length > 0">
            <MemberCard v-for="member in members" :key="member.id" :member="member" @remove="$emit('remove', member.id)" />
        </div>
        <div v-else-if="!loading && (!invitations || invitations.length === 0)" class="empty-state">
            No members or pending invitations found.
        </div>

        <!-- Pending Invitations -->
        <div v-if="invitations && invitations.length > 0" class="invitations-section">
            <h3 class="section-subtitle">Pending Invitations</h3>
            <div class="members-grid">
                <div v-for="invite in invitations" :key="invite.id" class="member-card invitation-card">
                    <div class="member-avatar invitation-avatar">
                        <f7-icon f7="envelope" />
                    </div>
                    <div class="member-info">
                        <div class="member-name">{{ invite.email }}</div>
                        <div class="member-role">{{ invite.role }} (Pending)</div>
                    </div>
                    <f7-button small color="red" @click="$emit('cancel-invitation', invite.id)">Cancel</f7-button>
                </div>
            </div>
        </div>

        <!-- Loading Skeletons -->
        <div class="members-grid" v-if="loading && members.length === 0">
            <div v-for="i in 4" :key="'skel-mem-' + i" class="member-card skeleton-text skeleton-effect-blink">
                 <div class="member-avatar skeleton-block" style="width: 40px; height: 40px; border-radius: 50%;"></div>
                 <div class="member-info" style="flex:1">
                     <div class="skeleton-block" style="width: 60%; height: 14px; margin-bottom: 4px;"></div>
                     <div class="skeleton-block" style="width: 40%; height: 12px;"></div>
                 </div>
            </div>
        </div>
    </section>
</template>
<script setup lang="ts">
import { f7Button, f7Icon } from 'framework7-vue';
import type { AppInvitation, AppMember } from '../types/app-detail.types';
import MemberCard from './MemberCard.vue';

defineProps<{
    members: AppMember[];
    invitations?: AppInvitation[];
    loading: boolean;
}>();

defineEmits(['invite', 'remove', 'cancel-invitation']);
</script>

<style scoped>
.members-section {
    background: white;
    border-radius: 12px;
    padding: 24px;
}

.section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
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
