<template>
    <f7-popup v-model:opened="isOpen" class="review-popup">
        <f7-view>
            <f7-page class="review-page">
                <f7-navbar :title="`Review: ${response?.enumerator?.name || 'Assignment'}`">
                    <f7-nav-right>
                        <f7-link popup-close class="close-link">Tutup</f7-link>
                    </f7-nav-right>
                </f7-navbar>

                <!-- Assignment Metadata Card -->
                <div class="metadata-card">
                    <div class="metadata-header">
                        <span class="meta-badge" :class="`meta-status-${response?.status}`">
                            {{ response?.status ? response.status.toUpperCase() : 'UNKNOWN' }}
                        </span>
                        <span class="meta-date">{{ response ? formatDate(response.updated_at) : '' }}</span>
                    </div>
                    <div class="metadata-body">
                        <div class="meta-item">
                            <span class="meta-label">Enumerator</span>
                            <span class="meta-value">{{ response?.enumerator?.name || 'Belum Ditugaskan' }}</span>
                        </div>
                        <div class="meta-item" v-if="response?.table_version?.version">
                            <span class="meta-label">Versi Formulir</span>
                            <span class="meta-value">v{{ response.table_version.version }}</span>
                        </div>
                    </div>
                </div>

                <f7-block-title class="section-title">Data Pengisian</f7-block-title>
                
                <!-- Main Submission Data Renderer -->
                <div v-if="response?.responses?.[0]" class="data-rendering-container">
                    
                    <!-- Loop based on schema fields if available -->
                    <template v-if="schemaFields.length > 0">
                        <div v-for="field in schemaFields" :key="field.name" class="data-field-row">
                            <div class="field-label-wrapper">
                                <span class="field-label-text">{{ field.label || field.name }}</span>
                                <span class="field-type-tag" v-if="field.type">{{ field.type }}</span>
                            </div>

                            <!-- Case A: Nested Repeat Group (Array of Objects) -->
                            <div v-if="isNestedData(submissionData[field.name])" class="nested-group-wrapper">
                                <div v-for="(subItem, idx) in submissionData[field.name]" :key="idx" class="nested-item-card">
                                    <div class="nested-item-header">Data Anak #{{ Number(idx) + 1 }}</div>
                                    <div class="nested-item-grid">
                                        <div v-for="(subVal, subKey) in subItem" :key="subKey" class="nested-item-cell">
                                            <span class="nested-cell-label">{{ subKey }}</span>
                                            
                                            <!-- Sub-image preview inside nested data -->
                                            <div v-if="isImageUrl(subVal)" class="nested-cell-image">
                                                <img :src="String(subVal)" class="nested-img" @click="previewFullImage(String(subVal))" />
                                            </div>
                                            <span v-else class="nested-cell-value">{{ subVal !== null ? subVal : '-' }}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Case B: Attachment Image / Signature -->
                            <div v-else-if="(field.type === 'image' || field.type === 'signature') && isImageUrl(submissionData[field.name])" class="attachment-preview">
                                <img :src="getImageUrl(submissionData[field.name])" class="attachment-img" @click="previewFullImage(getImageUrl(submissionData[field.name]))" />
                                <span class="img-hint">Ketuk untuk memperbesar</span>
                            </div>

                            <!-- Case C: Standard Flat Field -->
                            <div v-else class="flat-field-value">
                                {{ submissionData[field.name] !== undefined && submissionData[field.name] !== null ? submissionData[field.name] : '-' }}
                            </div>
                        </div>

                        <!-- Extra / Legacy Fields (Values present in data but deleted from current schema version) -->
                        <div v-if="extraFields.length > 0" class="extra-fields-block">
                            <div class="extra-fields-header">Legacy / Extra Data (Di luar skema versi ini)</div>
                            <div v-for="key in extraFields" :key="key" class="data-field-row extra-row">
                                <div class="field-label-wrapper">
                                    <span class="field-label-text legacy-label">{{ key }}</span>
                                </div>
                                <div class="flat-field-value legacy-value">
                                    {{ submissionData[key] }}
                                </div>
                            </div>
                        </div>
                    </template>

                    <!-- Flat Fallback: If no schema fields are defined in the version, fallback to flat key-value iteration -->
                    <template v-else>
                        <div v-for="(val, key) in submissionData" :key="key" class="data-field-row">
                            <div class="field-label-wrapper">
                                <span class="field-label-text">{{ key }}</span>
                            </div>
                            
                            <div v-if="isNestedData(val)" class="nested-group-wrapper">
                                <div v-for="(subItem, idx) in val" :key="idx" class="nested-item-card">
                                    <div class="nested-item-header">#{{ Number(idx) + 1 }}</div>
                                    <div class="nested-item-grid">
                                        <div v-for="(subVal, subKey) in subItem" :key="subKey" class="nested-item-cell">
                                            <span class="nested-cell-label">{{ subKey }}</span>
                                            <span class="nested-cell-value">{{ subVal }}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div v-else-if="isImageUrl(val)" class="attachment-preview">
                                <img :src="getImageUrl(val)" class="attachment-img" @click="previewFullImage(getImageUrl(val))" />
                            </div>
                            <div v-else class="flat-field-value">
                                {{ val !== null ? val : '-' }}
                            </div>
                        </div>
                    </template>
                </div>

                <!-- Prelist fallback if no submission yet -->
                <div v-else-if="response?.prelist_data" class="data-rendering-container prelist-box">
                    <div class="prelist-notice display-flex justify-content-space-between align-items-center">
                        <div class="display-flex align-items-center gap-half">
                            <f7-icon f7="info_circle" size="20" />
                            <span>Data Pre-list (Belum ada respon yang dikirim)</span>
                        </div>
                        <f7-button v-if="!isEditingPrelist" small outline color="blue" @click="startEditPrelist">
                            <f7-icon f7="pencil" size="14" class="margin-right-half" /> Edit Prelist
                        </f7-button>
                    </div>

                    <!-- Edit Mode Active -->
                    <div v-if="isEditingPrelist" class="prelist-edit-container margin-top">
                        <div v-for="(val, key) in editablePrelist" :key="key" class="data-field-row edit-row">
                            <div class="field-label-wrapper">
                                <span class="field-label-text font-bold">{{ key }}</span>
                            </div>
                            <div class="field-input-wrapper">
                                <input type="text" v-model="editablePrelist[key]" class="prelist-input" />
                            </div>
                        </div>
                        <div class="display-flex gap-half margin-top justify-content-flex-end">
                            <f7-button small outline color="gray" @click="isEditingPrelist = false" :disabled="savingPrelist">
                                Batal
                            </f7-button>
                            <f7-button small fill color="blue" @click="savePrelist" :disabled="savingPrelist">
                                <f7-icon f7="checkmark" size="14" class="margin-right-half" />
                                {{ savingPrelist ? 'Menyimpan...' : 'Simpan Perubahan' }}
                            </f7-button>
                        </div>
                    </div>

                    <!-- Readonly View -->
                    <template v-else>
                        <div v-for="(val, key) in response.prelist_data" :key="key" class="data-field-row">
                            <div class="field-label-wrapper">
                                <span class="field-label-text">{{ key }}</span>
                            </div>
                            <div class="flat-field-value">
                                {{ val !== null ? val : '-' }}
                            </div>
                        </div>
                    </template>
                </div>

                <!-- Actions Container -->
                <div v-if="canAction" class="action-buttons-container">
                    <div class="row">
                        <div class="col">
                            <f7-button 
                                fill 
                                large 
                                color="green" 
                                @click="handleApprove"
                                :disabled="processing"
                                class="action-btn approve-btn"
                            >
                                <f7-icon f7="checkmark_circle_fill" size="18" />
                                Terima Data
                            </f7-button>
                        </div>
                        <div class="col">
                            <f7-button 
                                outline 
                                large 
                                color="red" 
                                @click="handleReject"
                                :disabled="processing"
                                class="action-btn reject-btn"
                            >
                                <f7-icon f7="xmark_circle" size="18" />
                                Kembalikan
                            </f7-button>
                        </div>
                    </div>
                </div>

                <div v-if="response?.status === 'approved' || response?.status === 'synced'" class="synced-banner">
                    <f7-icon f7="checkmark_seal_fill" size="32" class="synced-icon" />
                    <span class="synced-text">Data Sudah Diterima & Disetujui</span>
                </div>
            </f7-page>
        </f7-view>
    </f7-popup>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { f7 } from 'framework7-vue';
import { ApiClient } from '../../../../common/api/ApiClient';

const props = defineProps<{
    opened: boolean;
    response: any | null;
}>();

const emit = defineEmits(['update:opened', 'action-complete']);

const isOpen = computed({
    get: () => props.opened,
    set: (val) => emit('update:opened', val)
});

const processing = ref(false);
const isEditingPrelist = ref(false);
const savingPrelist = ref(false);
const editablePrelist = ref<Record<string, any>>({});

function startEditPrelist() {
    if (props.response?.prelist_data) {
        editablePrelist.value = JSON.parse(JSON.stringify(props.response.prelist_data));
        isEditingPrelist.value = true;
    }
}

async function savePrelist() {
    if (!props.response?.id) return;
    savingPrelist.value = true;
    try {
        await ApiClient.put(`/assignments/${props.response.id}/prelist`, {
            prelist_data: editablePrelist.value
        });
        f7.toast.show({ text: '✓ Data prelist berhasil diperbarui', position: 'center', closeTimeout: 2000 });
        isEditingPrelist.value = false;
        emit('action-complete');
    } catch (e: any) {
        f7.dialog.alert('Gagal memperbarui prelist: ' + (e.message || e), 'Error');
    } finally {
        savingPrelist.value = false;
    }
}

const canAction = computed(() => {
    return (props.response?.status === 'submitted' || props.response?.status === 'completed') && props.response?.responses?.[0];
});

// Extract tableVersion fields
const schemaFields = computed<any[]>(() => {
    const fields = props.response?.tableVersion?.fields || props.response?.table_version?.fields;
    return Array.isArray(fields) ? fields : [];
});

// Extract submission data
const submissionData = computed<Record<string, any>>(() => {
    return props.response?.responses?.[0]?.data || {};
});

// Identify extra fields present in data but missing from schema definition
const extraFields = computed(() => {
    if (schemaFields.value.length === 0) return [];
    const schemaKeys = new Set(schemaFields.value.map(f => f.name));
    return Object.keys(submissionData.value).filter(key => !schemaKeys.has(key));
});

function formatDate(dateStr: string): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleString('id-ID');
}

function isNestedData(val: any): boolean {
    return Array.isArray(val) && val.length > 0 && typeof val[0] === 'object';
}

function isImageUrl(val: any): boolean {
    if (typeof val !== 'string') return false;
    return val.startsWith('http') || val.startsWith('/storage') || val.startsWith('data:image');
}

function getImageUrl(val: any): string {
    if (typeof val !== 'string') return '';
    return ApiClient.getAssetUrl(val);
}

function previewFullImage(url: string) {
    f7.dialog.create({
        title: 'Pratinjau Lampiran',
        content: `<div style="text-align: center; margin-top: 10px;"><img src="${url}" style="max-width: 100%; max-height: 70vh; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);" /></div>`,
        buttons: [{ text: 'Tutup' }]
    }).open();
}

async function handleApprove() {
    if (!props.response?.responses?.[0]) return;
    
    processing.value = true;
    try {
        await ApiClient.post(`/responses/${props.response.responses[0].id}/approve`);
        f7.toast.show({ text: '✓ Pengisian berhasil disetujui', position: 'center', closeTimeout: 2000 });
        emit('action-complete');
        isOpen.value = false;
    } catch (e) {
        console.error('[ResponseReviewDrawer] Approve Error:', e);
        f7.dialog.alert('Gagal menyetujui pengisian data.');
    } finally {
        processing.value = false;
    }
}

async function handleReject() {
    if (!props.response?.responses?.[0]) return;

    f7.dialog.prompt('Berikan alasan pengembalian data:', 'Kembalikan Pengisian', async (reason) => {
        if (!reason || reason.trim() === '') {
            f7.dialog.alert('Alasan pengembalian wajib diisi!');
            return;
        }
        processing.value = true;
        try {
            await ApiClient.post(`/responses/${props.response.responses[0].id}/reject`, { reason });
            f7.toast.show({ text: 'Data dikembalikan ke enumerator', position: 'center', closeTimeout: 2000 });
            emit('action-complete');
            isOpen.value = false;
        } catch (e) {
            console.error('[ResponseReviewDrawer] Reject Error:', e);
            f7.dialog.alert('Gagal mengembalikan pengisian data.');
        } finally {
            processing.value = false;
        }
    });
}
</script>

<style scoped>
.review-page {
    background: #f8fafc;
}

.close-link {
    font-weight: 500;
    color: #475569;
}

/* Metadata Card */
.metadata-card {
    background: #ffffff;
    margin: 16px;
    margin-top: 72px; /* Prevent fixed navbar overlapping metadata headers */
    padding: 16px;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.metadata-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #f1f5f9;
    padding-bottom: 10px;
    margin-bottom: 12px;
}

.meta-badge {
    font-size: 10px;
    font-weight: 700;
    padding: 3px 8px;
    border-radius: 20px;
}

.meta-status-assigned { background: #f1f5f9; color: #475569; }
.meta-status-in_progress { background: #eff6ff; color: #2563eb; }
.meta-status-submitted { background: #fff7ed; color: #ea580c; }
.meta-status-approved, .meta-status-synced { background: #f0fdfa; color: #0d9488; }
.meta-status-rejected { background: #fff1f2; color: #dc2626; }

.meta-date {
    font-size: 12px;
    color: #94a3b8;
}

.metadata-body {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
}

.meta-item {
    display: flex;
    flex-direction: column;
}

.meta-label {
    font-size: 10px;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 2px;
}

.meta-value {
    font-size: 13px;
    font-weight: 600;
    color: #1e293b;
}

.section-title {
    margin: 0 16px 8px 16px;
    font-size: 14px;
    font-weight: 700;
    color: #475569;
}

/* Data Rendering Container */
.data-rendering-container {
    background: #ffffff;
    margin: 0 16px 16px 16px;
    padding: 8px 16px;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
}

.data-field-row {
    padding: 12px 0;
    border-bottom: 1px solid #f1f5f9;
}

.data-field-row:last-child {
    border-bottom: none;
}

.field-label-wrapper {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
}

.field-label-text {
    font-size: 12px;
    font-weight: 600;
    color: #475569;
}

.field-type-tag {
    font-size: 9px;
    font-weight: 700;
    color: #94a3b8;
    background: #f1f5f9;
    padding: 1px 6px;
    border-radius: 4px;
    text-transform: uppercase;
}

.flat-field-value {
    font-size: 14px;
    color: #1e293b;
    word-break: break-word;
}

/* Repeat Group cards */
.nested-group-wrapper {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 8px;
}

.nested-item-card {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    overflow: hidden;
}

.nested-item-header {
    background: #f1f5f9;
    padding: 6px 12px;
    font-size: 11px;
    font-weight: bold;
    color: #475569;
    border-bottom: 1px solid #e2e8f0;
}

.nested-item-grid {
    padding: 10px;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
    gap: 8px;
}

.nested-item-cell {
    display: flex;
    flex-direction: column;
    padding: 4px;
}

.nested-cell-label {
    font-size: 10px;
    color: #94a3b8;
    margin-bottom: 2px;
}

.nested-cell-value {
    font-size: 12px;
    font-weight: 500;
    color: #334155;
    word-break: break-word;
}

.nested-cell-image {
    width: 60px;
    height: 60px;
    border-radius: 4px;
    overflow: hidden;
    border: 1px solid #e2e8f0;
}

.nested-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    cursor: pointer;
}

/* Image Attachment */
.attachment-preview {
    margin-top: 6px;
    max-width: 240px;
    position: relative;
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid #e2e8f0;
    box-shadow: 0 2px 4px rgba(0,0,0,0.02);
}

.attachment-img {
    width: 100%;
    height: auto;
    max-height: 200px;
    object-fit: contain;
    display: block;
    cursor: pointer;
    background: #f8fafc;
}

.img-hint {
    display: block;
    text-align: center;
    font-size: 10px;
    color: #94a3b8;
    padding: 4px 0;
    background: #f1f5f9;
}

/* Extra/Legacy Block */
.extra-fields-block {
    margin-top: 16px;
    border-top: 2px dashed #e2e8f0;
    padding-top: 8px;
}

.extra-fields-header {
    font-size: 11px;
    font-weight: bold;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 8px;
}

.extra-row {
    opacity: 0.85;
}

.legacy-label {
    color: #64748b;
}

.legacy-value {
    color: #475569;
}

.prelist-input {
    width: 100%;
    padding: 6px 10px;
    font-size: 13px;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    background: #ffffff;
    box-sizing: border-box;
    margin-top: 4px;
}

.prelist-input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.edit-row {
    margin-bottom: 12px;
}

/* Prelist Box */
.prelist-box {
    border-left: 4px solid #3b82f6;
}

.prelist-notice {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: #2563eb;
    background: #eff6ff;
    padding: 10px;
    border-radius: 8px;
    margin-bottom: 12px;
}

/* Actions styling */
.action-buttons-container {
    margin: 24px 16px;
}

.action-btn {
    font-weight: 600;
    border-radius: 8px;
    gap: 6px;
}

.approve-btn {
    box-shadow: 0 4px 12px rgba(22, 163, 74, 0.2);
}

.reject-btn {
    border-width: 1.5px;
}

.synced-banner {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 24px;
    text-align: center;
    color: #0d9488;
}

.synced-icon {
    margin-bottom: 8px;
}

.synced-text {
    font-weight: 700;
    font-size: 14px;
}

.review-popup {
    --f7-popup-tablet-width: 520px;
}
</style>

