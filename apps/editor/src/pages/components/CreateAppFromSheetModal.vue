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
                    <span>Pilih Sheet</span>
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
                    v-model:spreadsheet-url="form.spreadsheetUrl"
                    v-model:selected-sheet="form.selectedSheet"
                    :available-sheets="availableSheets"
                    :is-inspecting="isInspecting"
                    :inspect-error="inspectError"
                    @inspect="inspectSpreadsheet"
                />

                <Step3SchemaMapping
                    v-else-if="currentStep === 3"
                    v-model:columns="inferredColumns"
                    v-model:selected-key-column="selectedKeyColumn"
                    :sample-preview="samplePreview"
                    :available-field-types="availableFieldTypes"
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
                        v-else-if="currentStep === 3"
                        fill
                        color="green"
                        :loading="isCreatingApp"
                        :disabled="isCreatingApp || inferredColumns.length === 0"
                        @click="handleFinalizeApp"
                    >
                        <f7-icon f7="checkmark_alt" size="16" class="margin-right-half" />
                        Buat Aplikasi Sekarang
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
const isInspecting = ref(false);
const isCreatingApp = ref(false);
const inspectError = ref<string | null>(null);

// Temporary App ID for OAuth state mapping before App record is created
const tempAppId = ref<string>(
    typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : '00000000-0000-4000-8000-000000000001'
);

const { isAuthenticating, hasAuthenticated, triggerOAuthPopup } = useGoogleOAuthPopup();

const form = reactive({
    name: '',
    description: '',
    spreadsheetUrl: '',
    selectedSheet: '',
});

const availableSheets = ref<string[]>([]);
const inferredColumns = ref<GoogleSheetInferredColumn[]>([]);
const selectedKeyColumn = ref<string>('_cerdas_id');
const samplePreview = ref<Array<Array<unknown>>>([]);

const progressPercent = computed(() => (currentStep.value / 3) * 100);

const availableFieldTypes = [
    { label: 'Text (Single line / NIK / ID)', value: 'text' },
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
    inspectError.value = null;
}

async function handleConnectOAuth() {
    const success = await triggerOAuthPopup(tempAppId.value);
    if (success) {
        f7.toast.show({ text: 'Akun Google berhasil dihubungkan!', closeTimeout: 2500 });
    }
}

async function inspectSpreadsheet() {
    if (!form.spreadsheetUrl.trim()) return;

    try {
        isInspecting.value = true;
        inspectError.value = null;

        const res = await GoogleSheetApi.inspectSchema(tempAppId.value, {
            spreadsheet_url: form.spreadsheetUrl,
            sheet_name: form.selectedSheet || undefined,
        });

        availableSheets.value = res.sheets;
        form.selectedSheet = res.selected_sheet;
        inferredColumns.value = res.columns;
        selectedKeyColumn.value = res.suggested_key;
        samplePreview.value = res.preview;

        currentStep.value = 3;
    } catch (err: unknown) {
        const errorObj = err as Record<string, any>;
        inspectError.value =
            errorObj?.response?.data?.message || (err instanceof Error ? err.message : 'Gagal membaca data dari Google Spreadsheet.');
    } finally {
        isInspecting.value = false;
    }
}

async function handleFinalizeApp() {
    if (!form.name.trim() || inferredColumns.value.length === 0) return;

    try {
        isCreatingApp.value = true;
        const res = await GoogleSheetApi.createAppFromSheet({
            name: form.name.trim(),
            description: form.description.trim() || undefined,
            temp_app_id: tempAppId.value,
            spreadsheet_url: form.spreadsheetUrl,
            sheet_name: form.selectedSheet,
            columns: inferredColumns.value,
            key_column: selectedKeyColumn.value,
        });

        emit('created', { app_id: res.app_id, table_id: res.table_id });
        isOpen.value = false;

        f7.toast.show({ text: `Aplikasi '${form.name}' berhasil dibuat!`, closeTimeout: 2000 });

        const f7Inst = f7 as any;
        if (f7Inst.views?.main?.router) {
            f7Inst.views.main.router.navigate(`/apps/${res.app_id}/editor`);
        } else if (f7Inst.views?.current?.router) {
            f7Inst.views.current.router.navigate(`/apps/${res.app_id}/editor`);
        }
    } catch (err: unknown) {
        const errorObj = err as Record<string, any>;
        f7.dialog.alert(errorObj?.response?.data?.message || (err instanceof Error ? err.message : 'Gagal membuat aplikasi.'));
    } finally {
        isCreatingApp.value = false;
    }
}
</script>

<style scoped src="./create-app-sheet/CreateAppFromSheetModal.css"></style>
