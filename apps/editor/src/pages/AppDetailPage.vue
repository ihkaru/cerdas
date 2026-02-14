<template>
    <f7-page name="app-detail" class="app-detail-page">
        <!-- Page Header -->
        <AppHeader :app="app" @edit="handleEditApp" />

        <!-- Forms Grid Removed as per user request -->
        <!-- <FormsSection :forms="forms" :loading="loading" @create="handleCreateForm" /> -->

        <!-- Organizations (Complex Mode Only) -->
        <div v-if="app.mode === 'complex'">
            <OrganizationsSection :organizations="organizations" :loading="loading" @add="isAddOrgOpen = true"
                @remove="removeOrganization" />
        </div>

        <!-- App Members Section -->
        <MembersSection :members="members" :invitations="invitations" :loading="loading" @invite="handleInvite"
            @remove="handleRemoveMember" @cancel-invitation="handleCancelInvitation" />

        <!-- Dialogs -->
        <AddOrganizationDialog :opened="isAddOrgOpen" @update:opened="isAddOrgOpen = $event" @select="handleAddOrg" />
        <AddMemberDialog :opened="isAddMemberOpen" :loading="loading" @update:opened="isAddMemberOpen = $event"
            @submit="handleAddMember" />
    </f7-page>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import AddMemberDialog from '../app/pages/app-detail/components/AddMemberDialog.vue';
import AddOrganizationDialog from '../app/pages/app-detail/components/AddOrganizationDialog.vue';
import AppHeader from '../app/pages/app-detail/components/AppHeader.vue';
import MembersSection from '../app/pages/app-detail/components/MembersSection.vue';
import OrganizationsSection from '../app/pages/app-detail/components/OrganizationsSection.vue';
import { useAppDetail } from '../app/pages/app-detail/composables/useAppDetail';

const props = defineProps<{
    f7route: any;
    f7router: any;
}>();

const {
    app,
    members,
    organizations,
    loading,
    fetchApp,
    addOrganization,
    removeOrganization,
    addMember,
    removeMember,
    invitations,
    cancelInvitation
} = useAppDetail();



const isAddOrgOpen = ref(false);

function handleEditApp() {
    // Navigate strictly to the editor route for this app
    props.f7router.navigate(`/editor/${props.f7route.params.slug}`);
}

async function handleAddOrg(orgId: string | number) {
    await addOrganization(orgId);
    isAddOrgOpen.value = false;
}

const isAddMemberOpen = ref(false);

function handleInvite() {
    isAddMemberOpen.value = true;
}

async function handleAddMember(payload: { email: string, role: string }) {
    await addMember(payload.email, payload.role);
    isAddMemberOpen.value = false;
    // Toast removed as per request
}

async function handleRemoveMember(userId: string | number) {
    if (!confirm('Are you sure you want to remove this member?')) return;
    await removeMember(userId);
}

async function handleCancelInvitation(invitationId: string | number) {
    if (!confirm('Cancel this invitation?')) return;
    await cancelInvitation(invitationId);
}

onMounted(() => {
    if (props.f7route.params.slug) {
        fetchApp(props.f7route.params.slug);
    }
});
</script>

<style scoped>
.app-detail-page {
    padding: 24px 32px;
    background: #f8fafc;
}
</style>
