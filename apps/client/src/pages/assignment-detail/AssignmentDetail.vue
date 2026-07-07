<template>
    <f7-page name="assignment-detail" @page:beforeout="onPageBeforeOut" @page:afterin="onPageAfterIn">
        <f7-navbar :sliding="false" class="premium-navbar">
            <f7-nav-left>
                <f7-link @click="handleBack" class="nav-icon-btn back-btn" aria-label="Kembali">
                    <SvgIcon name="arrow_left" :size="22" />
                </f7-link>
            </f7-nav-left>
            <f7-nav-title class="premium-title">{{ pageTitle }}</f7-nav-title>
            <f7-nav-right>
                <span v-if="isReadOnly" class="nav-readonly-badge">Read Only</span>
                <f7-link v-else-if="!saving" @click="confirmSubmit" class="nav-finish-btn" aria-label="Selesai">
                    Finish
                </f7-link>
                <f7-preloader v-else size="20" class="margin-right" />
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
            <FormRenderer ref="formRenderer" :schema="schema" :initial-data="formData" :readonly="isReadOnly"
                :context="{ user: userContext, assignment: assignment, resolveAssetUrl: resolveAssetUrl }"
                @update:data="handleUpdate" />
        </div>

        <!-- Validation Summary FAB - Teleported to body to float above everything -->
        <Teleport to="body">
            <div class="global-validation-fab" v-if="fabVisible && !isReadOnly">
                <!-- Save Draft FAB (when dirty) -->
                <f7-fab v-if="isDirty" position="right-bottom" @click="saveDraft"
                    style="margin: 0; position: static;" class="app-fab app-fab--save">
                    <f7-icon f7="floppy_disk"></f7-icon>
                </f7-fab>
                <!-- Validation FAB (when clean) -->
                <f7-fab v-else position="right-bottom" @click="openValidationSummary"
                    style="margin: 0; position: static;" class="app-fab app-fab--validate">
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
import SvgIcon from '@/components/common/SvgIcon.vue';
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
    pinnedSchemaVersion, currentTableVersion, isReadOnly, loadData
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

/*
 * nav-finish-btn: Lightweight text action — NOT a filled button.
 * Primary submit action is the FAB (more prominent, thumb-friendly).
 * This is a secondary affordance for users who look at the navbar.
 */
.nav-finish-btn {
    display: flex;
    align-items: center;
    padding: 0 12px;
    height: 40px;
    font-size: 15px;
    font-weight: 600;
    color: var(--f7-theme-color, #2196f3) !important;
    border-radius: 8px;
    transition: background 0.15s, opacity 0.15s;
}

.nav-finish-btn:active {
    background: rgba(var(--f7-theme-color-rgb, 33, 150, 243), 0.08);
    opacity: 0.8;
}

.warning-bg {
    background-color: #f44336;
    color: white;
    border-radius: 8px;
}

.rounded {
    border-radius: 12px;
}

/*
 * global-validation-fab: Teleported FAB container for AssignmentDetail.
 *
 * Positioning rules match AppShell's .premium-fab exactly:
 *   - 16px offset from edges (Material Design FAB standard)
 *   - var(--f7-safe-area-bottom/right): Framework7 runtime safe-area insets
 *   - env(safe-area-inset-*): CSS native safe-area fallback for older WebKit
 *
 * This ensures the FAB sits above the home indicator on iPhone X+ and
 * is pixel-identical in position to the AppShell create FAB.
 */
.global-validation-fab {
    position: fixed;
    right: calc(var(--f7-safe-area-right, env(safe-area-inset-right, 0px)) + 16px);
    bottom: calc(var(--f7-safe-area-bottom, env(safe-area-inset-bottom, 0px)) + 16px);
    z-index: 12000;
    display: flex;
    align-items: center;
    justify-content: center;
}


.app-fab {
    transition: transform 0.18s ease, box-shadow 0.18s ease !important;
}

.app-fab:active {
    transform: scale(0.9) !important;
}

/* Save FAB: green with pulse ring — signals unsaved changes urgently */
/* Use --f7-fab-box-shadow so shadow applies to .fab > a (circular), not outer div */
.app-fab--save {
    --f7-fab-bg-color: #16a34a;
    --f7-fab-pressed-bg-color: #15803d;
    --f7-fab-box-shadow: 0 4px 14px rgba(22, 163, 74, 0.4);
    animation: fabPulseGreen 1.5s ease-in-out infinite;
}

.app-fab--save:active {
    --f7-fab-box-shadow: 0 2px 6px rgba(22, 163, 74, 0.2);
}

@keyframes fabPulseGreen {
    0%, 100% { --f7-fab-box-shadow: 0 4px 14px rgba(22, 163, 74, 0.4); }
    50%       { --f7-fab-box-shadow: 0 4px 14px rgba(22, 163, 74, 0.15); }
}

/* Validate FAB: theme blue — matches premium-fab in AppShell */
.app-fab--validate {
    --f7-fab-bg-color: var(--f7-theme-color, #2196f3);
    --f7-fab-pressed-bg-color: #1976d2;
    --f7-fab-box-shadow: 0 4px 14px rgba(33, 150, 243, 0.4);
}

.app-fab--validate:active {
    --f7-fab-box-shadow: 0 2px 6px rgba(33, 150, 243, 0.2);
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
