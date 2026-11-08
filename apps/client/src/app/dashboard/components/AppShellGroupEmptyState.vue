<template>
    <div class="empty-group-card animate-fade-in">
        <div class="empty-icon-circle">
            <f7-icon f7="folder_badge_minus" size="36px" color="gray"></f7-icon>
        </div>
        <h4 class="empty-title">Tidak Ditemukan Kelompok Data</h4>
        <p class="empty-desc">
            Tidak ada data responden yang cocok dengan kriteria kelompok atau filter yang dipilih.
        </p>
        <div class="empty-actions-col">
            <button v-if="currentLevel > 0" type="button" class="empty-btn secondary" @click="$emit('navigate-up')">
                <f7-icon f7="arrow_left" size="15px" class="margin-right-2"></f7-icon>
                Kembali ke Wilayah Sebelumnya
            </button>
            <button type="button" class="empty-btn primary" @click="$emit('show-all')">
                <f7-icon f7="list_bullet" size="15px" class="margin-right-2"></f7-icon>
                Tampilkan Semua {{ totalCount ? `${totalCount} ` : '' }}Data Tanpa Grouping
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
    currentLevel?: number;
    totalCount?: number;
}>(), {
    currentLevel: 0,
    totalCount: 0
});

defineEmits<{
    (e: 'navigate-up'): void;
    (e: 'show-all'): void;
}>();
</script>

<style scoped>
.margin-right-2 {
    margin-right: 4px;
}

.empty-group-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 36px 20px;
    margin: 16px 12px;
    background: #f8fafc;
    border: 1px dashed #cbd5e1;
    border-radius: 12px;
}

.empty-icon-circle {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: #e2e8f0;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 12px;
}

.empty-title {
    font-size: 15px;
    font-weight: 600;
    color: #334155;
    margin: 0 0 6px 0;
}

.empty-desc {
    font-size: 12px;
    color: #64748b;
    margin: 0 0 16px 0;
    max-width: 280px;
    line-height: 1.4;
}

.empty-actions-col {
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 100%;
    max-width: 260px;
}

.empty-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    padding: 8px 14px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    border: none;
}

.empty-btn.primary {
    background: #2563eb;
    color: #ffffff;
}

.empty-btn.primary:active {
    background: #1d4ed8;
}

.empty-btn.secondary {
    background: #ffffff;
    color: #334155;
    border: 1px solid #cbd5e1;
}

.empty-btn.secondary:active {
    background: #f1f5f9;
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(6px); }
    to { opacity: 1; transform: translateY(0); }
}

.animate-fade-in {
    animation: fadeIn 0.3s ease-out forwards;
}
</style>
