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
                <select :value="currentKeyColumn" @change="handleKeyChange(($event.target as HTMLSelectElement).value)">
                    <option value="_cerdas_id">_cerdas_id (Otomatis Tambah UUID Unik)</option>
                    <option v-for="col in currentColumns" :key="col.name" :value="col.name">
                        {{ col.original_header }} (Gunakan kolom ini sebagai kunci)
                    </option>
                </select>
            </f7-list-item>
        </f7-list>

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
