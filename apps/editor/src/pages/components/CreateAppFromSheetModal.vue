<template>
    <f7-popup
        class="create-from-sheet-popup"
        :opened="isOpen"
        @popup:closed="handleClose"
    >
        <f7-page>
            <!-- Navbar -->
            <f7-navbar title="Buat Aplikasi dari Google Sheet">
                <f7-nav-right>
                    <f7-link popup-close>Tutup</f7-link>
                </f7-nav-right>
            </f7-navbar>

            <!-- Wizard Progress Bar -->
            <div class="sheet-wizard-track">
                <div class="sheet-wizard-bar" :style="{ width: progressPercent + '%' }"></div>
            </div>

            <!-- Wizard Step Badges -->
            <div class="sheet-wizard-steps">
                <div class="sheet-step-item" :class="{ active: currentStep === 1, done: currentStep > 1 }">
                    <span class="step-num">1</span>
                    <span>Setup App</span>
                </div>
                <div class="sheet-step-item" :class="{ active: currentStep === 2, done: currentStep > 2 }">
                    <span class="step-num">2</span>
                    <span>Pilih Lembar Kerja</span>
                </div>
                <div class="sheet-step-item" :class="{ active: currentStep === 3 }">
                    <span class="step-num">3</span>
                    <span>Review Skema</span>
                </div>
            </div>

            <!-- Step Panes -->
            <div class="sheet-wizard-content">
                <Step1AppSetup
                    v-if="currentStep === 1"
                    v-model:name="form.name"
                    v-model:description="form.description"
                    :has-google-token="hasAuthenticated"
                    :is-authenticating="isAuthenticating"
                    @connect-oauth="handleConnectOAuth"
                />

                <Step2SheetPicker
                    v-else-if="currentStep === 2"
                    v-model:spreadsheet-url="wizard.spreadsheetUrl.value"
                    :available-sheets="wizard.availableSheets.value"
                    :selected-tabs="wizard.selectedTabs.value"
                    :table-names="wizard.tableNames.value"
                    :workbook-title="wizard.workbookMeta.value?.title"
                    :is-inspecting="wizard.isInspectingWorkbook.value"
                    :is-loading-schema="wizard.isLoadingTabSchema.value"
                    :inspect-error="wizard.inspectError.value"
                    @inspect-workbook="handleInspectWorkbook"
                    @toggle-tab="wizard.toggleTab"
                    @select-all-tabs="wizard.selectAllTabs"
                    @select-only-tab="wizard.selectOnlyTab"
                    @update-table-name="handleUpdateTableName"
                    @proceed="handleProceedToSchema"
                />

                <Step3SchemaMapping
                    v-else-if="currentStep === 3"
                    :selected-tabs="wizard.selectedTabs.value"
                    :active-tab="wizard.activeReviewTab.value"
                    :table-names="wizard.tableNames.value"
                    :tab-schemas="wizard.tabSchemas.value"
                    :tab-key-columns="wizard.tabKeyColumns.value"
                    :tab-previews="wizard.tabPreviews.value"
                    :available-field-types="availableFieldTypes"
                    @switch-tab="wizard.activeReviewTab.value = $event"
                    @update:columns="handleUpdateColumns"
                    @update:key-column="handleUpdateKeyColumn"
                />
            </div>

            <!-- Footer Toolbar -->
            <f7-toolbar bottom class="sheet-wizard-footer">
                <f7-button
                    v-if="currentStep > 1"
                    outline
                    color="gray"
                    @click="currentStep--"
                >
                    Kembali
                </f7-button>
                <div v-else></div>

                <div>
                    <f7-button
                        v-if="currentStep === 1"
                        fill
                        color="blue"
                        :disabled="!form.name.trim()"
                        @click="currentStep = 2"
                    >
                        Lanjut ke Pilih Sheet
                        <f7-icon f7="arrow_right" size="14" class="margin-left-half" />
                    </f7-button>

                    <f7-button
                        v-else-if="currentStep === 2 && wizard.availableSheets.value.length > 0"
                        fill
                        color="green"
                        :loading="wizard.isLoadingTabSchema.value"
                        :disabled="wizard.selectedTabs.value.length === 0 || wizard.isLoadingTabSchema.value"
                        @click="handleProceedToSchema"
                    >
                        Review Skema ({{ wizard.selectedTabs.value.length }} Tabel)
                        <f7-icon f7="arrow_right" size="14" class="margin-left-half" />
                    </f7-button>

                    <f7-button
                        v-else-if="currentStep === 3"
                        fill
                        color="green"
                        :loading="wizard.isCreatingApp.value"
                        :disabled="wizard.isCreatingApp.value || wizard.selectedTabs.value.length === 0"
                        @click="handleFinalizeApp"
                    >
                        <f7-icon f7="checkmark_alt" size="16" class="margin-right-half" />
                        Buat Aplikasi Sekarang ({{ wizard.selectedTabs.value.length }} Tabel)
                    </f7-button>
                </div>
            </f7-toolbar>
        </f7-page>
    </f7-popup>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { f7 } from 'framework7-vue';
import { GoogleSheetApi } from '@/common/api/GoogleSheetApi';
import { useGoogleOAuthPopup } from '@/common/composables/useGoogleOAuthPopup';
import type { GoogleSheetInferredColumn } from '@cerdas/types';

import Step1AppSetup from './create-app-sheet/Step1AppSetup.vue';
import Step2SheetPicker from './create-app-sheet/Step2SheetPicker.vue';
import Step3SchemaMapping from './create-app-sheet/Step3SchemaMapping.vue';
import { useSheetMultiTabWizard } from './create-app-sheet/useSheetMultiTabWizard';

const props = defineProps<{
    opened: boolean;
}>();

const emit = defineEmits<{
    (e: 'update:opened', val: boolean): void;
    (e: 'created', payload: { app_id: string; table_id: string }): void;
}>();

const isOpen = computed({
    get: () => props.opened,
    set: (val: boolean) => emit('update:opened', val),
});

const currentStep = ref<number>(1);

// Temporary App ID for OAuth state mapping before App record is created
const tempAppId = ref<string>(
    typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : '00000000-0000-4000-8000-000000000001'
);

const { isAuthenticating, hasAuthenticated, triggerOAuthPopup } = useGoogleOAuthPopup();
const wizard = useSheetMultiTabWizard();

const form = reactive({
    name: '',
    description: '',
});

const progressPercent = computed(() => (currentStep.value / 3) * 100);

const availableFieldTypes = [
    { label: 'Text (Single line / NIK / ID)', value: 'text' },
    { label: 'Long Text (Catatan / Paragraf)', value: 'long_text' },
    { label: 'Number / Desimal', value: 'number' },
    { label: 'Date (Tanggal)', value: 'date' },
    { label: 'Datetime (Waktu & Tanggal)', value: 'datetime' },
    { label: 'Time (Jam)', value: 'time' },
    { label: 'GPS / Lokasi', value: 'gps' },
    { label: 'Foto / Image', value: 'image' },
    { label: 'Tanda Tangan (Signature)', value: 'signature' },
    { label: 'Pilihan (Select / Dropdown)', value: 'select' },
    { label: 'URL / Link', value: 'url' },
];

function handleClose() {
    currentStep.value = 1;
    wizard.inspectError.value = null;
}

async function handleConnectOAuth() {
    const success = await triggerOAuthPopup(tempAppId.value);
    if (success) {
        f7.toast.show({ text: 'Akun Google berhasil dihubungkan!', closeTimeout: 2500 });
    }
}

async function handleInspectWorkbook() {
    await wizard.inspectWorkbook(tempAppId.value);
}

function handleUpdateTableName(tabName: string, newName: string) {
    wizard.tableNames.value[tabName] = newName;
}

async function handleProceedToSchema() {
    const ok = await wizard.loadAllSelectedSchemas(tempAppId.value);
    if (ok) {
        currentStep.value = 3;
    }
}

function handleUpdateColumns(tabName: string, cols: GoogleSheetInferredColumn[]) {
    wizard.tabSchemas.value[tabName] = cols;
}

function handleUpdateKeyColumn(tabName: string, key: string) {
    wizard.tabKeyColumns.value[tabName] = key;
}

async function handleFinalizeApp() {
    if (!form.name.trim() || wizard.selectedTabs.value.length === 0) return;

    try {
        wizard.isCreatingApp.value = true;
        const tabsPayload = wizard.buildTabsPayload();

        const res = await GoogleSheetApi.createAppFromSheet({
            name: form.name.trim(),
            description: form.description.trim() || undefined,
            temp_app_id: tempAppId.value,
            spreadsheet_url: wizard.spreadsheetUrl.value,
            tabs: tabsPayload,
        });

        emit('created', { app_id: res.app_id, table_id: res.table_id });
        isOpen.value = false;

        const tableCount = tabsPayload.length;
        f7.toast.show({
            text: `Aplikasi '${form.name}' berhasil dibuat dengan ${tableCount} tabel!`,
            closeTimeout: 2500,
        });

        const f7Views = f7.views as unknown as { main?: { router?: { navigate: (url: string) => void } }; current?: { router?: { navigate: (url: string) => void } } } | undefined;
        if (f7Views?.main?.router) {
            f7Views.main.router.navigate(`/apps/${res.app_id}/editor`);
        } else if (f7Views?.current?.router) {
            f7Views.current.router.navigate(`/apps/${res.app_id}/editor`);
        }
    } catch (err: unknown) {
        let errorMsg = 'Gagal membuat aplikasi.';
        if (err && typeof err === 'object') {
            const maybeAxios = err as { response?: { data?: { message?: string } } };
            if (maybeAxios.response?.data?.message) {
                errorMsg = maybeAxios.response.data.message;
            }
        } else if (err instanceof Error) {
            errorMsg = err.message;
        }
        f7.dialog.alert(errorMsg);
    } finally {
        wizard.isCreatingApp.value = false;
    }
}
</script>

<style scoped src="./create-app-sheet/CreateAppFromSheetModal.css"></style>
