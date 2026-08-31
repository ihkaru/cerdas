<template>
    <div class="step-pane">
        <div class="step-hero">
            <div class="hero-icon-wrap hero-sparkles">
                <f7-icon f7="wand_stars" size="36" />
            </div>
            <h3 class="hero-title">Review Skema &amp; Tipe Kolom</h3>
            <p class="hero-subtitle">
                Kami telah mendeteksi tipe data otomatis berdasarkan sampel isi sheet. Anda dapat menyesuaikan tipe field di bawah ini.
            </p>
        </div>

        <!-- Schema Mapping Table -->
        <div class="schema-mapping-card">
            <div class="mapping-header">
                <span class="mapping-title">Daftar Kolom Terdeteksi ({{ columns.length }})</span>
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
                        <tr v-for="(col, idx) in columns" :key="col.name">
                            <td>
                                <div class="col-name-main">{{ col.original_header }}</div>
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

        <!-- Primary Key Selection -->
        <f7-list strong-ios inset-ios class="margin-vertical">
            <f7-list-item title="Primary Key / Kolom Kunci" smart-select :smart-select-params="{ openIn: 'popover' }">
                <select :value="selectedKeyColumn" @change="$emit('update:selectedKeyColumn', ($event.target as HTMLSelectElement).value)">
                    <option value="_cerdas_id">_cerdas_id (Otomatis Tambah UUID Unik)</option>
                    <option v-for="col in columns" :key="col.name" :value="col.name">
                        {{ col.original_header }} (Gunakan kolom ini sebagai kunci)
                    </option>
                </select>
            </f7-list-item>
        </f7-list>

        <!-- Sample Data Preview -->
        <div v-if="samplePreview && samplePreview.length > 0" class="sample-preview-card">
            <div class="preview-header">
                <f7-icon f7="eye" size="16" class="margin-right-half" />
                <span>Pratinjau Data Sampel ({{ samplePreview.length }} Baris Pertama)</span>
            </div>
            <div class="preview-table-scroll">
                <table class="preview-table">
                    <thead>
                        <tr>
                            <th v-for="col in columns" :key="col.name">{{ col.original_header }}</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(row, rIdx) in samplePreview" :key="rIdx">
                            <td v-for="(col, cIdx) in columns" :key="col.name">
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
import type { GoogleSheetInferredColumn } from '@cerdas/types';

const props = defineProps<{
    columns: GoogleSheetInferredColumn[];
    selectedKeyColumn: string;
    samplePreview: Array<Array<unknown>>;
    availableFieldTypes: Array<{ label: string; value: string }>;
}>();

const emit = defineEmits<{
    (e: 'update:columns', cols: GoogleSheetInferredColumn[]): void;
    (e: 'update:selectedKeyColumn', key: string): void;
}>();

function handleTypeChange(idx: number, newType: string) {
    const updated = [...props.columns];
    const target = updated[idx];
    if (target) {
        updated[idx] = { ...target, type: newType };
        emit('update:columns', updated);
    }
}

function handleLabelChange(idx: number, newLabel: string) {
    const updated = [...props.columns];
    const target = updated[idx];
    if (target) {
        updated[idx] = { ...target, label: newLabel };
        emit('update:columns', updated);
    }
}
</script>
