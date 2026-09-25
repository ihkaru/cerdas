<template>
    <section class="members-section">
        <div class="section-header">
            <div class="section-title-wrap">
                <h2>Team Members</h2>
                <span class="count-badge" v-if="members.length > 0">{{ members.length }}</span>
            </div>
            <f7-button outline small @click="$emit('invite')" class="invite-btn">
                <f7-icon f7="person_badge_plus" size="14" class="margin-right-half" />
                Invite Member
            </f7-button>
        </div>
        
        <!-- Existing Members Grid -->
        <div class="members-grid" v-if="members.length > 0">
            <MemberCard
                v-for="member in members"
                :key="member.id"
                :member="member"
                @remove="$emit('remove', member.id)"
            />
        </div>
        <div v-else-if="!loading && (!invitations || invitations.length === 0)" class="empty-members-state">
            <div class="empty-icon-wrap">
                <f7-icon f7="person_2" size="24" />
            </div>
            <div class="empty-text">
                <p class="empty-title">Belum ada anggota tim</p>
                <p class="empty-sub">Undang kolaborator untuk mengelola formulir atau mengumpulkan data bersama.</p>
            </div>
            <f7-button fill small @click="$emit('invite')" class="empty-invite-btn">
                <f7-icon f7="plus" size="12" class="margin-right-half" />
                Undang Anggota
            </f7-button>
        </div>

        <!-- Pending Invitations -->
        <div v-if="invitations && invitations.length > 0" class="invitations-section">
            <h3 class="section-subtitle">Undangan Tertunda (Pending)</h3>
            <div class="members-grid">
                <div v-for="invite in invitations" :key="invite.id" class="member-card invitation-card">
                    <div class="invitation-avatar">
                        <f7-icon f7="envelope" size="14" />
                    </div>
                    <div class="member-info">
                        <div class="member-name" :title="invite.email">{{ invite.email }}</div>
                        <div class="member-role-pending">{{ invite.role }} (Menunggu)</div>
                    </div>
                    <button class="btn-cancel-invite" @click="$emit('cancel-invitation', invite.id)" title="Batalkan Undangan">
                        <f7-icon f7="xmark" size="12" />
                    </button>
                </div>
            </div>
        </div>

        <!-- Loading Skeletons -->
        <div class="members-grid" v-if="loading && members.length === 0">
            <div v-for="i in 4" :key="'skel-mem-' + i" class="member-card skeleton-card">
                 <div class="skeleton-avatar"></div>
                 <div class="skeleton-info">
                     <div class="skeleton-line title"></div>
                     <div class="skeleton-line sub"></div>
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

defineEmits<{
    (e: 'invite'): void;
    (e: 'remove', id: string | number): void;
    (e: 'cancel-invitation', id: string | number): void;
}>();
</script>

<style scoped>
.members-section {
    background: #ffffff;
    border-radius: 12px;
    padding: 24px;
    border: 1px solid #e2e8f0;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
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

.invite-btn {
    --f7-button-text-color: #2563eb;
    --f7-button-border-color: #bfdbfe;
    border-radius: 8px;
    font-weight: 500;
    height: 32px;
}

.members-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 12px;
}

.empty-members-state {
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

.empty-invite-btn {
    --f7-button-bg-color: #2563eb;
    border-radius: 6px;
    font-weight: 500;
    flex-shrink: 0;
}

.invitations-section {
    margin-top: 24px;
    padding-top: 20px;
    border-top: 1px solid #f1f5f9;
}

.section-subtitle {
    font-size: 14px;
    font-weight: 600;
    color: #64748b;
    margin: 0 0 12px 0;
    text-transform: uppercase;
    letter-spacing: 0.02em;
}

.invitation-card {
    border-style: dashed;
    background: #fffbeb;
    border-color: #fde68a;
}

.invitation-avatar {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    background: #fef3c7;
    color: #d97706;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.member-info {
    flex: 1;
    min-width: 0;
}

.member-name {
    font-size: 13px;
    font-weight: 500;
    color: #1e293b;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.member-role-pending {
    font-size: 11px;
    color: #d97706;
    font-weight: 500;
}

.btn-cancel-invite {
    all: unset;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 4px;
    color: #94a3b8;
    flex-shrink: 0;
    transition: all 0.15s;
}

.btn-cancel-invite:hover {
    background: #fef2f2;
    color: #dc2626;
}

/* Skeletons */
.skeleton-card {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    padding: 10px 12px;
    display: flex;
    align-items: center;
    gap: 10px;
}

.skeleton-avatar {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    background: #e2e8f0;
    flex-shrink: 0;
}

.skeleton-info {
    flex: 1;
}

.skeleton-line {
    background: #e2e8f0;
    border-radius: 4px;
}

.skeleton-line.title {
    height: 12px;
    width: 65%;
    margin-bottom: 4px;
}

.skeleton-line.sub {
    height: 10px;
    width: 40%;
}
</style>
