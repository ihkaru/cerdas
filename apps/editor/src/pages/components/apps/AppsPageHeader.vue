<template>
    <div class="page-header">
        <div class="header-info">
            <h1 class="page-title">Applications</h1>
            <p class="page-subtitle">Kelola dan pantau aplikasi pengumpulan data survei Anda</p>
        </div>

        <div class="header-controls">
            <!-- Search Input -->
            <div class="search-input-wrap">
                <f7-icon f7="search" size="14" class="search-icon" />
                <input
                    type="search"
                    class="apps-search-input"
                    placeholder="Cari aplikasi..."
                    :value="searchQuery"
                    @input="$emit('update:searchQuery', ($event.target as HTMLInputElement).value)"
                />
                <button
                    v-if="searchQuery"
                    class="clear-search-btn"
                    @click="$emit('update:searchQuery', '')"
                    title="Hapus pencarian"
                >
                    <f7-icon f7="xmark_circle_fill" size="14" />
                </button>
            </div>

            <!-- Action Buttons -->
            <div class="action-buttons">
                <button class="btn-action btn-trash" @click="$emit('open-trash')" title="Sampah Aplikasi">
                    <f7-icon f7="trash" size="15" />
                    <span>Sampah</span>
                    <span v-if="trashedCount > 0" class="trash-badge">
                        {{ trashedCount }}
                    </span>
                </button>

                <button class="btn-action btn-sheet" @click="$emit('open-sheet')" title="Buat dari Google Sheets">
                    <f7-icon f7="logo_google" size="14" />
                    <span>From Google Sheets</span>
                </button>

                <button class="btn-action btn-primary" @click="$emit('create-app')" title="Buat Aplikasi Baru">
                    <f7-icon f7="plus" size="14" />
                    <span>New App</span>
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
defineProps<{
    searchQuery: string;
    trashedCount: number;
}>();

defineEmits<{
    (e: 'update:searchQuery', value: string): void;
    (e: 'open-trash'): void;
    (e: 'open-sheet'): void;
    (e: 'create-app'): void;
}>();
</script>

<style scoped>
.page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 16px;
    margin-bottom: 24px;
}

.header-info {
    min-width: 200px;
}

.page-title {
    font-size: 24px;
    font-weight: 600;
    color: #1e293b;
    margin: 0;
}

.page-subtitle {
    font-size: 13.5px;
    color: #64748b;
    margin: 4px 0 0 0;
}

.header-controls {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
}

/* Search input */
.search-input-wrap {
    position: relative;
    display: flex;
    align-items: center;
}

.search-icon {
    position: absolute;
    left: 10px;
    color: #94a3b8;
    pointer-events: none;
}

.apps-search-input {
    height: 36px;
    width: 220px;
    padding: 0 30px 0 32px;
    font-size: 13px;
    border-radius: 8px;
    border: 1px solid #cbd5e1;
    background: #ffffff;
    color: #1e293b;
    outline: none;
    transition: all 0.15s ease;
}

.apps-search-input:focus {
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
    width: 260px;
}

.clear-search-btn {
    all: unset;
    position: absolute;
    right: 8px;
    cursor: pointer;
    color: #94a3b8;
    display: flex;
    align-items: center;
}

.clear-search-btn:hover {
    color: #64748b;
}

/* Unified action buttons */
.action-buttons {
    display: flex;
    align-items: center;
    gap: 8px;
}

.btn-action {
    all: unset;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 36px;
    padding: 0 14px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 500;
    transition: all 0.15s ease;
    box-sizing: border-box;
}

.btn-action:active {
    transform: scale(0.98);
}

.btn-trash {
    border: 1px solid #cbd5e1;
    background: #ffffff;
    color: #64748b;
}

.btn-trash:hover {
    border-color: #fca5a5;
    background: #fef2f2;
    color: #dc2626;
}

.trash-badge {
    background: #ef4444;
    color: #ffffff;
    font-size: 10.5px;
    padding: 1px 6px;
    border-radius: 10px;
    font-weight: 600;
}

.btn-sheet {
    border: 1px solid #bbf7d0;
    background: #f0fdf4;
    color: #15803d;
}

.btn-sheet:hover {
    background: #dcfce7;
    border-color: #86efac;
}

.btn-primary {
    background: #2563eb;
    color: #ffffff;
    border: 1px solid transparent;
}

.btn-primary:hover {
    background: #1d4ed8;
}
</style>
