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
        <MembersSection :members="members" :loading="loading" />

        <!-- Dialogs -->
        <AddOrganizationDialog :opened="isAddOrgOpen" @update:opened="isAddOrgOpen = $event" @select="handleAddOrg" />
    </f7-page>
</template>

<script setup lang="ts">
import { useAppStore } from '@/stores';
import { onMounted, ref } from 'vue';
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
    removeOrganization
} = useAppDetail();

const appStore = useAppStore();

const isAddOrgOpen = ref(false);

function handleEditApp() {
    // Navigate strictly to the editor route for this app
    props.f7router.navigate(`/editor/${props.f7route.params.slug}`);
}

async function handleAddOrg(orgId: string | number) {
    await addOrganization(orgId);
    isAddOrgOpen.value = false;
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
