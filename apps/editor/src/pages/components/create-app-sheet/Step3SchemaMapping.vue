<template>
    <div class="step-pane">
        <div class="step-hero">
            <div class="hero-icon-wrap hero-sparkles">
                <f7-icon f7="wand_stars" size="36" />
            </div>
            <h3 class="hero-title">Review Skema &amp; Tipe Kolom</h3>
            <p class="hero-subtitle">
                Kami telah mendeteksi tipe data otomatis berdasarkan sampel isi sheet. Anda dapat menyesuaikan tipe field dan primary key untuk setiap lembar kerja di bawah ini.
            </p>
        </div>

        <!-- Sub-Navigation Pills for Multi-Tab -->
        <div v-if="selectedTabs && selectedTabs.length > 1" class="review-tabs-bar">
            <button
                v-for="tab in selectedTabs"
                :key="tab"
                type="button"
                class="review-tab-pill"
                :class="{ active: tab === activeTab }"
                @click="$emit('switchTab', tab)"
            >
                <f7-icon f7="table" size="14" />
                <span>{{ tableNames[tab] || tab }}</span>
                <span class="badge color-gray" style="font-size: 10px; margin-left: 4px;">
                    {{ (tabSchemas[tab] || []).length }} kolom
                </span>
            </button>
        </div>

        <!-- Active Tab Header Info -->
        <div v-if="selectedTabs && selectedTabs.length > 1" class="margin-bottom-half" style="display: flex; align-items: center; justify-content: space-between;">
            <span style="font-size: 13px; font-weight: 600; color: #334155;">
                Konfigurasi: <strong>{{ tableNames[activeTab] || activeTab }}</strong> (Tab Sheet: <code>{{ activeTab }}</code>)
            </span>
        </div>

        <!-- Schema Mapping Table -->
        <div class="schema-mapping-card">
            <div class="mapping-header">
                <span class="mapping-title">Daftar Kolom Terdeteksi ({{ currentColumns.length }})</span>
                <span class="mapping-info">Pilih tipe field form yang sesuai</span>
            </div>
            <div class="mapping-table-wrap">
                <table class="mapping-table">
                    <thead>
                        <tr>
                            <th style="width: 35%">Header Google Sheet</th>
                            <th style="width: 35%">Tipe Field Cerdas</th>
                            <th style="width: 30%">Label Form</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(col, idx) in currentColumns" :key="col.name">
                            <td>
                                <div class="col-name-main" style="display: flex; align-items: center; gap: 6px;">
                                    <span>{{ col.original_header }}</span>
                                    <span v-if="col.name === currentKeyColumn" class="badge color-orange" style="font-size: 9px; padding: 2px 6px;">
                                        🔑 Key
                                    </span>
                                </div>
                                <div class="col-name-slug">key: {{ col.name }}</div>
                            </td>
                            <td>
                                <select
                                    :value="col.type"
                                    class="type-select"
                                    @change="handleTypeChange(idx, ($event.target as HTMLSelectElement).value)"
                                >
                                    <option v-for="t in availableFieldTypes" :key="t.value" :value="t.value">
                                        {{ t.label }}
                                    </option>
                                </select>
                            </td>
                            <td>
                                <input
                                    type="text"
                                    :value="col.label"
                                    class="type-select"
                                    placeholder="Label kolom"
                                    @input="handleLabelChange(idx, ($event.target as HTMLInputElement).value)"
                                />
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Primary Key Selection Card -->
        <div class="schema-mapping-card margin-vertical">
            <div class="mapping-header" style="background: #f8fafc; border-bottom: 1px solid #e2e8f0; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center;">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <f7-icon f7="key_fill" size="18" color="orange" />
                    <span style="font-size: 14px; font-weight: 700; color: #1e293b;">Primary Key (Kunci Alami Sasaran)</span>
                </div>
                <span class="badge color-orange" style="font-size: 10px; font-weight: 600;">Penting untuk Integritas</span>
            </div>
            <div style="padding: 14px 16px;">
                <p style="font-size: 12px; color: #64748b; margin: 0 0 12px 0; line-height: 1.5;">
                    Pilih kolom yang berisi ID unik untuk setiap baris sasaran (misal: <strong>No Usulan, NIK, ID</strong>). Menggunakan kunci alami memastikan penugasan lapangan <strong>tidak akan menduplikasi</strong> meskipun spreadsheet disortir, difilter, atau baris bergeser di kemudian hari.
                </p>

                <div v-if="candidateKeyColumns.length > 0 && currentKeyColumn === '_cerdas_id'" class="margin-bottom-half" style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 6px; padding: 8px 12px; display: flex; align-items: center; gap: 8px;">
                    <f7-icon f7="sparkles" size="16" color="green" />
                    <span style="font-size: 11px; color: #065f46;">
                        Kolom ID unik terdeteksi: <strong>{{ candidateKeyColumns.map(c => c.original_header).join(', ') }}</strong>. Disarankan memilih salah satu kolom tersebut.
                    </span>
                </div>

                <div style="display: flex; align-items: center; gap: 12px;">
                    <select
                        :value="currentKeyColumn"
                        class="type-select"
                        style="width: 100%; font-weight: 600; padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 6px;"
                        @change="handleKeyChange(($event.target as HTMLSelectElement).value)"
                    >
                        <optgroup v-if="candidateKeyColumns.length > 0" label="✨ Rekomendasi (Kolom ID Alami)">
                            <option v-for="col in candidateKeyColumns" :key="col.name" :value="col.name">
                                🔑 {{ col.original_header }} (Disarankan)
                            </option>
                        </optgroup>
                        <optgroup label="Seluruh Kolom Sheet">
                            <option v-for="col in currentColumns" :key="col.name" :value="col.name">
                                {{ col.original_header }}
                            </option>
                        </optgroup>
                        <optgroup label="Fallback Sistem">
                            <option value="_cerdas_id">_cerdas_id (Otomatis Tambah Kolom UUID ke Sheet)</option>
                        </optgroup>
                    </select>
                </div>
            </div>
        </div>

        <!-- Sample Data Preview -->
        <div v-if="currentPreview && currentPreview.length > 0" class="sample-preview-card">
            <div class="preview-header">
                <f7-icon f7="eye" size="16" class="margin-right-half" />
                <span>Pratinjau Data Sampel ({{ currentPreview.length }} Baris Pertama)</span>
            </div>
            <div class="preview-table-scroll">
                <table class="preview-table">
                    <thead>
                        <tr>
                            <th v-for="col in currentColumns" :key="col.name">{{ col.original_header }}</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(row, rIdx) in currentPreview" :key="rIdx">
                            <td v-for="(col, cIdx) in currentColumns" :key="col.name">
                                {{ Array.isArray(row) ? row[cIdx] ?? '—' : '—' }}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { GoogleSheetInferredColumn } from '@cerdas/types';

const props = defineProps<{
    selectedTabs: string[];
    activeTab: string;
    tableNames: Record<string, string>;
    tabSchemas: Record<string, GoogleSheetInferredColumn[]>;
    tabKeyColumns: Record<string, string>;
    tabPreviews: Record<string, Array<Array<unknown>>>;
    availableFieldTypes: Array<{ label: string; value: string }>;
}>();

const emit = defineEmits<{
    (e: 'switchTab', tabName: string): void;
    (e: 'update:columns', tabName: string, cols: GoogleSheetInferredColumn[]): void;
    (e: 'update:keyColumn', tabName: string, key: string): void;
}>();

const currentColumns = computed<GoogleSheetInferredColumn[]>(() => {
    return props.tabSchemas[props.activeTab] || [];
});

const currentKeyColumn = computed<string>(() => {
    return props.tabKeyColumns[props.activeTab] || '_cerdas_id';
});

const candidateKeyColumns = computed<GoogleSheetInferredColumn[]>(() => {
    const priority = [
        'no_usulan_perkimtan',
        'no_usulan',
        'nomor_usulan',
        'nik_pemohon',
        'nik',
        'no_kk',
        'id_responden',
        'id_penerima',
        'id',
        'uuid',
    ];
    return currentColumns.value.filter((col) => {
        const slug = col.name.toLowerCase();
        return (
            priority.includes(slug) ||
            slug.startsWith('no_') ||
            slug.startsWith('nomor_') ||
            slug.includes('nik') ||
            slug.includes('id') ||
            slug.includes('kode')
        );
    });
});

const currentPreview = computed<Array<Array<unknown>>>(() => {
    return props.tabPreviews[props.activeTab] || [];
});

function handleTypeChange(idx: number, newType: string) {
    const updated = [...currentColumns.value];
    const target = updated[idx];
    if (target) {
        updated[idx] = { ...target, type: newType };
        emit('update:columns', props.activeTab, updated);
    }
}

function handleLabelChange(idx: number, newLabel: string) {
    const updated = [...currentColumns.value];
    const target = updated[idx];
    if (target) {
        updated[idx] = { ...target, label: newLabel };
        emit('update:columns', props.activeTab, updated);
    }
}

function handleKeyChange(newKey: string) {
    emit('update:keyColumn', props.activeTab, newKey);
}
</script>
