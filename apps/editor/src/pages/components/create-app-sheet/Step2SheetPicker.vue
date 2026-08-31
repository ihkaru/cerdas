<template>
    <div class="step-pane">
        <div class="step-hero">
            <div class="hero-icon-wrap hero-sheet">
                <f7-icon f7="table" size="36" />
            </div>
            <h3 class="hero-title">Pilih Google Spreadsheet</h3>
            <p class="hero-subtitle">
                Masukkan URL atau link bagikan Google Sheet yang berisi header dan data survei Anda.
            </p>
        </div>

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

            <f7-list-item v-if="availableSheets.length > 1" title="Pilih Lembar Kerja (Tab)" smart-select :smart-select-params="{ openIn: 'popover' }">
                <select :value="selectedSheet" @change="$emit('update:selectedSheet', ($event.target as HTMLSelectElement).value)">
                    <option v-for="s in availableSheets" :key="s" :value="s">{{ s }}</option>
                </select>
            </f7-list-item>
        </f7-list>

        <div class="inspect-action-bar">
            <f7-button
                fill
                large
                color="green"
                :loading="isInspecting"
                :disabled="!spreadsheetUrl || isInspecting"
                @click="$emit('inspect')"
            >
                <f7-icon f7="sparkles" size="18" class="margin-right-half" />
                Analisis Struktur Kolom
            </f7-button>
        </div>

        <div v-if="inspectError" class="inspect-error-alert">
            <f7-icon f7="exclamationmark_triangle_fill" size="20" color="red" />
            <span>{{ inspectError }}</span>
        </div>
    </div>
</template>

<script setup lang="ts">
defineProps<{
    spreadsheetUrl: string;
    selectedSheet: string;
    availableSheets: string[];
    isInspecting: boolean;
    inspectError: string | null;
}>();

defineEmits<{
    (e: 'update:spreadsheetUrl', val: string): void;
    (e: 'update:selectedSheet', val: string): void;
    (e: 'inspect'): void;
}>();
</script>
