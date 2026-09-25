<template>
    <f7-popup class="org-detail-popup" :opened="opened" @popup:closed="$emit('update:opened', false)">
        <f7-page>
            <f7-navbar :title="organization?.name || 'Organization'">
                <f7-nav-right>
                    <f7-link popup-close>Close</f7-link>
                </f7-nav-right>
            </f7-navbar>

            <f7-toolbar tabbar position="top">
                <f7-link tab-link="#tab-details" tab-link-active>Details</f7-link>
                <f7-link tab-link="#tab-members">Members</f7-link>
            </f7-toolbar>

            <f7-tabs>
                <!-- Tab 1: Details -->
                <f7-tab id="tab-details" class="page-content" tab-active>
                    <f7-block-title>Organization Info</f7-block-title>
                    <f7-list strong-ios dividers-ios inset-ios>
                        <f7-list-input label="Name" type="text" :value="editOrg.name"
                            @input="editOrg.name = $event.target.value" />
                        <f7-list-input label="Code" type="text" :value="editOrg.code"
                            @input="editOrg.code = $event.target.value" />
                    </f7-list>
                    <f7-block>
                        <f7-button fill @click="saveDetails" :loading="saving">Save Changes</f7-button>
                    </f7-block>

                    <f7-block-footer>
                        Created by: {{ organization?.creator?.name || 'System' }}
                    </f7-block-footer>
                </f7-tab>

                <!-- Tab 2: Members -->
                <f7-tab id="tab-members" class="page-content">
                    <f7-block-title>Team Members</f7-block-title>
                    <f7-list strong-ios dividers-ios inset-ios>
                        <f7-list-item v-for="member in members" :key="member.id" :title="member.name"
                            :subtitle="member.email">
                            <template #after>
                                <f7-badge color="blue">{{ member.pivot?.role || 'member' }}</f7-badge>
                                <f7-button small color="red" @click="removeMember(member)">Remove</f7-button>
                            </template>
                        </f7-list-item>

                        <!-- Pending Invitations -->
                        <f7-list-item v-for="invite in invitations" :key="invite.id" :title="invite.email"
                            subtitle="Pending Invitation">
                            <template #after>
                                <f7-badge color="orange">Pending</f7-badge>
                                <f7-button small color="red" @click="cancelInvitation(invite)">Cancel</f7-button>
                            </template>
                        </f7-list-item>

                        <f7-list-item v-if="members.length === 0 && invitations.length === 0"
                            title="No members yet"></f7-list-item>
                    </f7-list>

                    <f7-block-title>Add Member</f7-block-title>
                    <f7-list strong-ios dividers-ios inset-ios>
                        <f7-list-input label="Email" type="email" placeholder="user@example.com" :value="newMemberEmail"
                            @input="newMemberEmail = $event.target.value" clear-button>
                            <template #inner-end>
                                <f7-button small fill @click="addMember" :loading="addingMember">Add</f7-button>
                            </template>
                        </f7-list-input>
                    </f7-list>
                </f7-tab>
            </f7-tabs>
        </f7-page>
    </f7-popup>
</template>

<script setup lang="ts">
import { ApiClient } from '@/common/api/ApiClient';
import { f7, f7Badge, f7Block, f7BlockFooter, f7BlockTitle, f7Button, f7Link, f7List, f7ListInput, f7ListItem, f7Navbar, f7NavRight, f7Page, f7Popup, f7Tab, f7Tabs, f7Toolbar } from 'framework7-vue';
import { reactive, ref, watch } from 'vue';
import type { OrganizationInvitation, OrganizationItem, OrganizationMember } from './organizations/organizations.types';

const props = defineProps<{
    opened: boolean;
    organization: OrganizationItem | null;
}>();

const emit = defineEmits<{
    (e: 'update:opened', val: boolean): void;
    (e: 'refresh'): void;
}>();

const members = ref<OrganizationMember[]>([]);
const invitations = ref<OrganizationInvitation[]>([]);
const editOrg = reactive({ name: '', code: '' });
const saving = ref(false);
const newMemberEmail = ref('');
const addingMember = ref(false);

watch(() => props.organization, (org) => {
    if (org) {
        editOrg.name = org.name;
        editOrg.code = org.code;
        if (props.opened) fetchMembers();
    }
});

watch(() => props.opened, (val) => {
    if (val && props.organization) fetchMembers();
});

async function saveDetails() {
    if (!props.organization) return;
    saving.value = true;
    try {
        await ApiClient.put(`/organizations/${props.organization.id}`, editOrg);
        f7.toast.create({ text: 'Organization updated', closeTimeout: 2000 }).open();
        emit('refresh');
    } catch (e) {
        console.error('Update failed', e);
        f7.toast.create({ text: 'Failed to update', closeTimeout: 2000, cssClass: 'color-red' }).open();
    } finally {
        saving.value = false;
    }
}

async function fetchMembers() {
    if (!props.organization) return;
    try {
        const res = await ApiClient.get(`/organizations/${props.organization.id}/members`);
        if (res.data.success) {
            members.value = res.data.data;
            invitations.value = res.data.invitations || [];
        }
    } catch (e) {
        console.error('Fetch members failed', e);
    }
}

async function addMember() {
    const emailToAdd = newMemberEmail.value.trim();
    if (!emailToAdd || !props.organization) return;
    addingMember.value = true;
    try {
        const res = await ApiClient.post(`/organizations/${props.organization.id}/members`, { email: emailToAdd, role: 'member' });
        newMemberEmail.value = '';
        await fetchMembers();
        f7.toast.create({ text: res.data.message || 'Anggota berhasil ditambahkan', closeTimeout: 2000 }).open();
    } catch (e: any) {
        console.error('Add member failed', e);
        // If 409, message is "User already invited"
        f7.toast.create({ text: e.response?.data?.message || 'Gagal menambahkan anggota', closeTimeout: 2000, cssClass: 'color-red' }).open();
    } finally {
        addingMember.value = false;
    }
}

async function removeMember(user: OrganizationMember) {
    f7.dialog.confirm(
        `Keluarkan ${user.name || user.email} dari organisasi?`,
        'Hapus Anggota',
        async () => {
            if (!props.organization) return;
            try {
                await ApiClient.delete(`/organizations/${props.organization.id}/members/${user.id}`);
                await fetchMembers();
                f7.toast.create({ text: 'Anggota berhasil dikeluarkan', closeTimeout: 2000 }).open();
            } catch (err: unknown) {
                console.error('Remove member failed', err);
                const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Gagal mengeluarkan anggota';
                f7.toast.create({ text: msg, closeTimeout: 2000, cssClass: 'color-red' }).open();
            }
        }
    );
}

async function cancelInvitation(invite: OrganizationInvitation) {
    f7.dialog.confirm(
        `Batalkan undangan untuk ${invite.email}?`,
        'Batalkan Undangan',
        async () => {
            if (!props.organization) return;
            try {
                await ApiClient.delete(`/organizations/${props.organization.id}/invitations/${invite.id}`);
                await fetchMembers();
                f7.toast.create({ text: 'Undangan dibatalkan', closeTimeout: 2000 }).open();
            } catch (err: unknown) {
                console.error('Cancel failed', err);
                const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Gagal membatalkan undangan';
                f7.toast.create({ text: msg, closeTimeout: 2000, cssClass: 'color-red' }).open();
            }
        }
    );
}

</script>
