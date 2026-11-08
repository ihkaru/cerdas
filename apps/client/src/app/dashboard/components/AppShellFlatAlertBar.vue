<template>
    <div class="flat-mode-alert-bar">
        <div class="flat-mode-alert-text">
            <f7-icon f7="rectangle_stack" size="14px" color="blue" class="margin-right-2" />
            <span>Mode Daftar Penuh Aktif ({{ totalAssignments }} responden)</span>
        </div>
        <button type="button" class="flat-mode-return-btn" @click="$emit('return-to-folder')">
            Beralih ke Folder
        </button>
    </div>
</template>

<script setup lang="ts">
defineProps<{
    totalAssignments: number;
}>();

defineEmits<{
    (e: 'return-to-folder'): void;
}>();
</script>

<style scoped>
.flat-mode-alert-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #eff6ff;
    border-bottom: 1px solid #bfdbfe;
    padding: 6px 12px;
    font-size: 12px;
}

.flat-mode-alert-text {
    display: flex;
    align-items: center;
    color: #1e40af;
    font-weight: 500;
}

.flat-mode-return-btn {
    background: #ffffff;
    border: 1px solid #93c5fd;
    border-radius: 6px;
    color: #2563eb;
    font-size: 11px;
    font-weight: 600;
    padding: 3px 8px;
    cursor: pointer;
}

.flat-mode-return-btn:active {
    background: #dbeafe;
}
</style>
