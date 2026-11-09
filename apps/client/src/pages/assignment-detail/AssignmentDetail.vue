<template>
    <f7-page name="assignment-detail">
        <f7-navbar :sliding="false" class="premium-navbar">
            <f7-nav-left>
                <f7-link @click="handleBack" class="nav-icon-btn back-btn" aria-label="Kembali">
                    <SvgIcon name="arrow_left" :size="22" />
                </f7-link>
            </f7-nav-left>
            <f7-nav-title class="premium-title">{{ pageTitle }}</f7-nav-title>
            <f7-nav-right>
                <span v-if="isReadOnly" class="nav-readonly-badge">Read Only</span>
                <f7-preloader v-else-if="saving" size="20" class="margin-right" />
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

        <div v-if="schema && assignment" class="padding-top padding-bottom-xl">
            <FormRenderer :key="previewRevision" ref="formRenderer" :schema="schema" :initial-data="formData" :readonly="isReadOnly"
                :context="{ user: userContext, assignment: assignment, resolveAssetUrl: resolveAssetUrl }"
                @update:data="handleUpdate" />

            <!-- Bottom Form Completion Actions -->
            <div v-if="!isReadOnly" class="bottom-form-actions block padding-horizontal margin-top-lg margin-bottom-xl">
                <f7-button fill large color="green" class="btn-submit-form" :loading="saving" @click="confirmSubmit">
                    <f7-icon f7="paperplane_fill" size="18" class="margin-right-half" />
                    <span>Selesaikan &amp; Kirim Survei</span>
                </f7-button>

                <div class="display-flex margin-top-half" style="gap: 8px;">
                    <f7-button v-if="isDirty" tonal large color="blue" class="flex-1" :disabled="saving" @click="saveDraft">
                        <f7-icon f7="floppy_disk" size="18" class="margin-right-half" />
                        <span>Simpan Draft</span>
                    </f7-button>
                    <f7-button v-if="hasExistingDraft" tonal large color="red" class="flex-1" :disabled="saving" @click="discardDraft">
                        <f7-icon f7="trash" size="18" class="margin-right-half" />
                        <span>Buang Draft</span>
                    </f7-button>
                </div>
            </div>
        </div>
    </f7-page>
</template>

<script setup lang="ts">
import { FormRenderer } from '@cerdas/form-engine';
import SvgIcon from '@/components/common/SvgIcon.vue';
import { f7 } from 'framework7-vue';
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { apiClient } from '../../common/api/ApiClient';
import { useDirtyTracking } from '../../common/composables/useDirtyTracking';
import { useVersionGate } from '../../common/composables/useVersionGate';
import { useAuthStore } from '../../common/stores/authStore';
import VersionBanner from './components/VersionBanner.vue';
import { useAssignmentLoader } from './composables/useAssignmentLoader';
import { useAssignmentSave } from './composables/useAssignmentSave';
import { useLivePreview } from './composables/useLivePreview';
import type { FormRendererRef } from './composables/useValidationSummary';
import { useVersionPinning } from './composables/useVersionPinning';

const props = defineProps<{
    assignmentId: string;
}>();

const authStore = useAuthStore();
const resolveAssetUrl = (val: string) => apiClient.getAssetUrl(val);

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
    pinnedSchemaVersion, currentTableVersion, isReadOnly, hasExistingDraft, loadData
} = useAssignmentLoader(props.assignmentId);

// 2. Dirty Tracking
const { isDirty, takeSnapshot, revert, clearDirty } = useDirtyTracking(formData);

const handleUpdate = (data: Record<string, unknown>) => {
    formData.value = data;
};

// 3. Form Renderer Ref
const formRenderer = ref<FormRendererRef | null>(null);

// 4. Version Pinning
const { migrating, handleMigrateVersion } = useVersionPinning(
    props.assignmentId, assignment, schema, formData,
    pinnedSchemaVersion, currentTableVersion, takeSnapshot
);

// 5. Version Gate
const versionGate = useVersionGate(() => assignment.value?.table_id || null);

// 6. Saving Logic
const { saving, saveDraft, confirmSubmit, discardDraft } = useAssignmentSave(
    props.assignmentId, formData, clearDirty, formRenderer, assignment, hasExistingDraft
);

// 7. Live Preview
const { previewRevision, handleSchemaOverrideUpdate } = useLivePreview(schema, assignment);

// Page Title
const pageTitle = computed(() => {
    if (!assignment.value) return 'Loading...';
    const pd = assignment.value.prelist_data || {};
    return pd.name || 'Assignment';
});

const handleBack = () => {
    if (!isDirty.value) {
        f7.view.main.router.back();
        return;
    }

    f7.dialog.create({
        title: 'Keluar dari Formulir?',
        text: 'Terdapat perubahan data yang belum disimpan. Apa yang ingin Anda lakukan?',
        buttons: [
            {
                text: 'Simpan sebagai Draft',
                color: 'green',
                onClick: async () => {
                    await saveDraft();
                    f7.view.main.router.back();
                }
            },
            {
                text: 'Buang Perubahan & Keluar',
                color: 'red',
                onClick: () => {
                    formData.value = revert();
                    f7.view.main.router.back();
                }
            },
            {
                text: 'Lanjut Mengisi',
                color: 'gray'
            }
        ],
        verticalButtons: true
    }).open();
};

onMounted(async () => {
    await loadData();
    takeSnapshot(formData.value);
    window.addEventListener('schema-override-updated', handleSchemaOverrideUpdate as EventListener);
});

onUnmounted(() => {
    window.removeEventListener('schema-override-updated', handleSchemaOverrideUpdate as EventListener);
});
</script>

<style scoped>
/* ============================================================
   Navbar — matches AppShellNavbar.vue design tokens exactly
   ============================================================ */
.premium-navbar {
    background: transparent !important;
}

:deep(.navbar-bg) {
    background: rgba(255, 255, 255, 0.8) !important;
    backdrop-filter: blur(16px) saturate(180%) !important;
    -webkit-backdrop-filter: blur(16px) saturate(180%) !important;
    border-bottom: 1px solid rgba(0, 0, 0, 0.05) !important;
    box-shadow: 0 4px 30px rgba(0, 0, 0, 0.02) !important;
}

:deep(.navbar-inner) {
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: relative;
    padding: 0 8px !important;
}

/* Centered title — same absolute-center trick as AppShellNavbar */
.premium-title, :deep(.title) {
    position: absolute !important;
    left: 50% !important;
    top: 50% !important;
    transform: translate(-50%, -50%) !important;
    margin: 0 !important;
    text-align: center;
    font-weight: 600 !important;
    font-size: 17px !important;
    color: #111827 !important;
    width: auto !important;
    max-width: calc(100% - 130px) !important;
    white-space: nowrap !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
    pointer-events: none !important;
    display: block !important;
}

/* Circular icon button — same as AppShellNavbar .nav-icon-btn */
.nav-icon-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    color: #4b5563 !important;
    background: transparent;
    transition: background-color 0.2s ease, color 0.2s ease, transform 0.1s ease;
    margin: 0 2px;
}

.nav-icon-btn:active {
    background-color: rgba(0, 0, 0, 0.06);
    color: #111827 !important;
    transform: scale(0.95);
}

.bottom-form-actions {
    margin-top: 24px;
}

.btn-submit-form {
    font-weight: 700;
    letter-spacing: 0.3px;
    box-shadow: 0 4px 14px rgba(76, 175, 80, 0.3);
    border-radius: 12px;
}

.warning-bg {
    background-color: #f44336;
    color: white;
    border-radius: 8px;
}

.rounded {
    border-radius: 12px;
}

.nav-readonly-badge {
    font-size: 11px;
    font-weight: 600;
    color: #ef4444;
    background: rgba(239, 68, 68, 0.08);
    padding: 4px 8px;
    border-radius: 6px;
    margin-right: 8px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}
</style>
