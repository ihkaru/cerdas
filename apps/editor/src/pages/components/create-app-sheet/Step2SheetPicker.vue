<template>
    <div class="step-pane">
        <div class="step-hero">
            <div class="hero-icon-wrap hero-sheet">
                <f7-icon f7="table" size="36" />
            </div>
            <h3 class="hero-title">Pilih Google Spreadsheet &amp; Lembar Kerja</h3>
            <p class="hero-subtitle">
                Masukkan link Google Sheet. Anda dapat memilih satu atau beberapa tab sheet sekaligus untuk dijadikan tabel-tabel di aplikasi Anda.
            </p>
        </div>

        <!-- URL Input -->
        <f7-list strong-ios inset-ios class="margin-bottom">
            <f7-list-input
                label="Google Spreadsheet URL"
                type="url"
                placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit"
                :value="spreadsheetUrl"
                @input="$emit('update:spreadsheetUrl', ($event.target as HTMLInputElement).value)"
                clear-button
                required
            />
        </f7-list>

        <!-- Inspect Button (Before Sheets Loaded) -->
        <div v-if="availableSheets.length === 0" class="inspect-action-bar">
            <f7-button
                fill
                large
                color="blue"
                :loading="isInspecting"
                :disabled="!spreadsheetUrl || isInspecting"
                @click="$emit('inspectWorkbook')"
            >
                <f7-icon f7="search" size="18" class="margin-right-half" />
                Periksa Spreadsheet &amp; Baca Tab
            </f7-button>
        </div>

        <!-- Workbook Info Banner & Tab Selector (After Sheets Loaded) -->
        <div v-else>
            <!-- Workbook Title Banner -->
            <div class="workbook-meta-card">
                <div class="workbook-meta-info">
                    <f7-icon f7="checkmark_circle_fill" size="24" color="green" />
                    <div>
                        <div class="workbook-meta-title">{{ workbookTitle || 'Google Spreadsheet Terhubung' }}</div>
                        <div class="workbook-meta-subtitle">{{ availableSheets.length }} tab lembar kerja ditemukan</div>
                    </div>
                </div>
                <f7-button
                    small
                    outline
                    color="gray"
                    :loading="isInspecting"
                    @click="$emit('inspectWorkbook')"
                >
                    <f7-icon f7="arrow_counterclockwise" size="14" class="margin-right-half" />
                    Refresh Tab
                </f7-button>
            </div>

            <!-- Tab Selection Hub -->
            <div class="tabs-selection-section">
                <div class="tabs-selection-header">
                    <div>
                        <span class="tabs-selection-title">Pilih Lembar Kerja (Tab)</span>
                        <span class="tabs-badge">{{ selectedTabs.length }} dari {{ availableSheets.length }} dipilih</span>
                    </div>
                    <div class="tabs-selection-actions">
                        <f7-button
                            small
                            outline
                            color="blue"
                            @click="$emit('selectAllTabs')"
                        >
                            Pilih Semua
                        </f7-button>
                        <f7-button
                            small
                            outline
                            color="gray"
                            :disabled="!availableSheets[0]"
                            @click="availableSheets[0] && $emit('selectOnlyTab', availableSheets[0])"
                        >
                            Tab Pertama Saja
                        </f7-button>
                    </div>
                </div>

                <!-- Tab Cards List -->
                <div class="tab-cards-list">
                    <div
                        v-for="(sheetName, idx) in availableSheets"
                        :key="sheetName"
                        class="tab-select-card"
                        :class="{ selected: selectedTabs.includes(sheetName) }"
                    >
                        <div class="tab-card-top" @click="$emit('toggleTab', sheetName)">
                            <div class="tab-card-left">
                                <f7-checkbox
                                    :checked="selectedTabs.includes(sheetName)"
                                    @change="$emit('toggleTab', sheetName)"
                                />
                                <f7-icon f7="table" size="18" :color="selectedTabs.includes(sheetName) ? 'blue' : 'gray'" />
                                <span class="tab-name-label">{{ sheetName }}</span>
                            </div>
                            <span v-if="idx === 0" class="badge color-blue" style="font-size: 11px">Tabel Utama</span>
                        </div>

                        <!-- Editable Table Name if Selected -->
                        <div v-if="selectedTabs.includes(sheetName)" class="tab-input-row" @click.stop>
                            <span class="tab-input-label">Nama Tabel di Cerdas:</span>
                            <input
                                type="text"
                                class="tab-name-input"
                                :value="tableNames[sheetName] || sheetName"
                                placeholder="Nama tabel..."
                                @input="$emit('updateTableName', sheetName, ($event.target as HTMLInputElement).value)"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <!-- Proceed to Schema Review Button -->
            <div class="inspect-action-bar margin-top">
                <f7-button
                    fill
                    large
                    color="green"
                    :loading="isLoadingSchema"
                    :disabled="selectedTabs.length === 0 || isLoadingSchema"
                    @click="$emit('proceed')"
                >
                    <f7-icon f7="sparkles" size="18" class="margin-right-half" />
                    Lanjut ke Review Skema ({{ selectedTabs.length }} Tabel)
                </f7-button>
            </div>
        </div>

        <!-- Error Alert -->
        <div v-if="inspectError" class="inspect-error-alert">
            <f7-icon f7="exclamationmark_triangle_fill" size="20" color="red" />
            <span>{{ inspectError }}</span>
        </div>
    </div>
</template>

<script setup lang="ts">
defineProps<{
    spreadsheetUrl: string;
    availableSheets: string[];
    selectedTabs: string[];
    tableNames: Record<string, string>;
    workbookTitle?: string;
    isInspecting: boolean;
    isLoadingSchema: boolean;
    inspectError: string | null;
}>();

defineEmits<{
    (e: 'update:spreadsheetUrl', val: string): void;
    (e: 'inspectWorkbook'): void;
    (e: 'toggleTab', tabName: string): void;
    (e: 'selectAllTabs'): void;
    (e: 'selectOnlyTab', tabName: string): void;
    (e: 'updateTableName', tabName: string, newName: string): void;
    (e: 'proceed'): void;
}>();
</script>
