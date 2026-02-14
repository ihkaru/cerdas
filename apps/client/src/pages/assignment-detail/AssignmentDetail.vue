<template>
    <f7-page name="assignment-detail" @page:beforeout="onPageBeforeOut" @page:afterin="onPageAfterIn">
        <f7-navbar :sliding="false">
            <f7-nav-left>
                <f7-link @click="handleBack">
                    <f7-icon f7="arrow_left" />
                </f7-link>
            </f7-nav-left>
            <f7-nav-title>{{ pageTitle }}</f7-nav-title>
            <f7-nav-right>
                <div class="display-flex align-items-center margin-right-half">
                    <f7-preloader v-if="saving" size="20" />
                    <f7-chip v-else-if="isDirty" text="Belum Disimpan" color="orange" />
                </div>
                <f7-button fill round small color="green" @click="confirmSubmit">Finish</f7-button>
            </f7-nav-right>
        </f7-navbar>

        <f7-block v-if="loading" class="text-align-center margin-top-xl">
            <f7-preloader size="42" />
            <p class="margin-top">Loading form...</p>
        </f7-block>

        <f7-block v-else-if="error" class="text-align-center margin-top-xl warning-bg padding white-text rounded">
            <f7-icon f7="exclamationmark_triangle_fill" size="48" color="white"></f7-icon>
            <p class="size-16 font-weight-bold">{{ error }}</p>
            <f7-button fill color="white" text-color="red" @click="loadData">Retry</f7-button>
        </f7-block>

        <!-- Version Banners -->
        <VersionBanner :pinnedSchemaVersion="pinnedSchemaVersion" :currentTableVersion="currentTableVersion"
            :versionGate="versionGate" :migrating="migrating" @upgrade="handleMigrateVersion" />

        <div v-if="schema && assignment" class="padding-bottom-xl">
            <FormRenderer ref="formRenderer" :schema="schema" :initial-data="formData"
                :context="{ user: userContext, assignment: assignment, resolveAssetUrl: resolveAssetUrl }"
                @update:data="handleUpdate" />
        </div>

        <!-- Validation Summary FAB - Teleported to body to float above everything -->
        <Teleport to="body">
            <div class="global-validation-fab" v-if="fabVisible"
                style="position: fixed; right: 20px; bottom: 20px; z-index: 12000;">
                <!-- Save Draft FAB (when dirty) -->
                <f7-fab v-if="isDirty" position="right-bottom" color="green" @click="saveDraft"
                    style="margin: 0; position: static;" class="fab-save-pulse">
                    <f7-icon f7="floppy_disk"></f7-icon>
                </f7-fab>
                <!-- Validation FAB (when clean) -->
                <f7-fab v-else position="right-bottom" color="blue" @click="openValidationSummary"
                    style="margin: 0; position: static;">
                    <f7-icon f7="checkmark_shield"></f7-icon>
                    <f7-badge v-if="summaryBadgeCount > 0" color="red">{{ summaryBadgeCount }}</f7-badge>
                </f7-fab>
            </div>
        </Teleport>

        <!-- Validation Summary Sheet -->
        <ValidationSummarySheet :opened="validationSheetOpen" :summary="validationSummary"
            @close="validationSheetOpen = false" @scroll-to-field="scrollToField" />
    </f7-page>
</template>

<script setup lang="ts">
import { FormRenderer } from '@cerdas/form-engine';
import { f7 } from 'framework7-vue';
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { apiClient } from '../../common/api/ApiClient';
import { useDirtyTracking } from '../../common/composables/useDirtyTracking';
import { useVersionGate } from '../../common/composables/useVersionGate';
import { useAuthStore } from '../../common/stores/authStore';
import ValidationSummarySheet from './components/ValidationSummarySheet.vue';
import VersionBanner from './components/VersionBanner.vue';
import { useAssignmentLoader } from './composables/useAssignmentLoader';
import { useAssignmentSave } from './composables/useAssignmentSave';
import { useLivePreview } from './composables/useLivePreview';
import type { FormRendererRef } from './composables/useValidationSummary';
import { useValidationSummary } from './composables/useValidationSummary';
import { useVersionPinning } from './composables/useVersionPinning';

const props = defineProps<{
    assignmentId: string;
}>();

const authStore = useAuthStore();
const resolveAssetUrl = (val: string) => apiClient.getAssetUrl(val);
const fabVisible = ref(false);

const userContext = computed(() => ({
    id: authStore.user?.id ?? 0,
    email: authStore.user?.email ?? '',
    name: authStore.user?.name ?? '',
    role: authStore.user?.role ?? 'enumerator',
    organizationId: authStore.user?.organizationId ?? null,
}));

// 1. Data Loading
const {
    loading, error, assignment, schema, formData,
    pinnedSchemaVersion, currentTableVersion, loadData
} = useAssignmentLoader(props.assignmentId);

// 2. Dirty Tracking
const { isDirty, takeSnapshot, revert, clearDirty } = useDirtyTracking(formData);

const handleUpdate = (data: Record<string, unknown>) => {
    formData.value = data;
};

// 3. Form Renderer Ref & Validation UI
const formRenderer = ref<FormRendererRef | null>(null);
const {
    validationSheetOpen, validationSummary, summaryBadgeCount,
    openValidationSummary, scrollToField
} = useValidationSummary(formRenderer);

// 4. Version Pinning
const { migrating, handleMigrateVersion } = useVersionPinning(
    props.assignmentId, assignment, schema, formData,
    pinnedSchemaVersion, currentTableVersion, takeSnapshot
);

// 5. Version Gate
const versionGate = useVersionGate(() => assignment.value?.table_id || null);

// 6. Saving Logic
const { saving, saveDraft, confirmSubmit } = useAssignmentSave(
    props.assignmentId, formData, clearDirty, formRenderer
);

// 7. Live Preview
const { handleSchemaOverrideUpdate } = useLivePreview(schema, assignment);

// Page Title
const pageTitle = computed(() => {
    if (!assignment.value) return 'Loading...';
    const pd = assignment.value.prelist_data || {};
    return pd.name || 'Assignment';
});

// Lifecycle & Navigation
const onPageAfterIn = () => {
    fabVisible.value = true;
};

const onPageBeforeOut = () => {
    fabVisible.value = false;
};

const handleBack = () => {
    if (!isDirty.value) {
        f7.view.main.router.back();
        return;
    }

    f7.dialog.create({
        title: 'Perubahan Belum Disimpan',
        text: 'Anda memiliki perubahan yang belum disimpan. Apa yang ingin dilakukan?',
        buttons: [
            {
                text: 'Buang',
                color: 'red',
                onClick: () => {
                    formData.value = revert();
                    f7.view.main.router.back();
                }
            },
            {
                text: 'Simpan Draft',
                color: 'green',
                onClick: async () => {
                    await saveDraft();
                    f7.view.main.router.back();
                }
            },
            {
                text: 'Batal',
                color: 'gray'
            }
        ],
        verticalButtons: true
    }).open();
};

onMounted(async () => {
    await loadData();
    takeSnapshot(formData.value);
    setTimeout(() => { fabVisible.value = true; }, 500);
    window.addEventListener('schema-override-updated', handleSchemaOverrideUpdate as EventListener);
});

onUnmounted(() => {
    window.removeEventListener('schema-override-updated', handleSchemaOverrideUpdate as EventListener);
});
</script>

<style scoped>
.warning-bg {
    background-color: #f44336;
    color: white;
    border-radius: 8px;
}

.rounded {
    border-radius: 12px;
}

.fab-save-pulse {
    animation: fabPulse 1.5s ease-in-out infinite;
}

@keyframes fabPulse {

    0%,
    100% {
        box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.4);
    }

    50% {
        box-shadow: 0 0 0 12px rgba(76, 175, 80, 0);
    }
}
</style>
