<template>
    <f7-page name="app-detail" class="app-detail-page">
        <!-- Page Header -->
        <AppHeader :app="app" @create="handleCreateForm" />

        <!-- Forms Grid -->
        <FormsSection :forms="forms" :loading="loading" @create="handleCreateForm" />

        <!-- App Members Section -->
        <MembersSection :members="members" :loading="loading" />
    </f7-page>
</template>

<script setup lang="ts">
import { useAppStore } from '@/stores';
import { onMounted } from 'vue';
import AppHeader from '../app/pages/app-detail/components/AppHeader.vue';
import FormsSection from '../app/pages/app-detail/components/FormsSection.vue';
import MembersSection from '../app/pages/app-detail/components/MembersSection.vue';
import { useAppDetail } from '../app/pages/app-detail/composables/useAppDetail';
import { useFormDialog } from '../app/pages/app-detail/composables/useFormDialog';

const props = defineProps<{
    f7route: any;
    f7router: any;
}>();

const { app, forms, members, loading, fetchApp } = useAppDetail();
const { showCreateFormDialog } = useFormDialog();
const appStore = useAppStore(); // needed solely for ID access if not exposed by composable or for refreshing

function handleCreateForm() {
    showCreateFormDialog(app.value.id, async (newFormId) => {
        // Refresh App to show new form (or manually push if optimized)
        await appStore.fetchApp(props.f7route.params.slug);

        // Navigate to editor
        props.f7router.navigate(`/forms/${newFormId}`);
    });
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
