<template>
    <div class="empty-schema-container">
        <div class="empty-schema-icon">
            <SvgIcon name="square" :size="48" class="icon-pulse" />
        </div>
        <h3 class="empty-schema-title">Formulir Belum Dibuat</h3>
        <p class="empty-schema-desc">
            Silakan tambahkan kolom (fields) baru di editor sebelah kiri untuk mulai merancang pratinjau formulir Anda di sini.
        </p>
    </div>
</template>

<script setup lang="ts">
import SvgIcon from '@/components/common/SvgIcon.vue';
</script>

<style scoped>
.empty-schema-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 48px 24px;
    height: 60vh;
    text-align: center;
    box-sizing: border-box;
}

.empty-schema-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: rgba(33, 150, 243, 0.05);
    color: var(--f7-theme-color, #2196f3);
    margin-bottom: 20px;
}

.empty-schema-title {
    font-size: 17px;
    font-weight: 600;
    color: #111827;
    margin: 0 0 6px 0;
}

.empty-schema-desc {
    font-size: 13px;
    color: #6b7280;
    line-height: 1.5;
    max-width: 260px;
    margin: 0;
}

.icon-pulse {
    animation: icon-pulse-anim 2s infinite ease-in-out;
}

@keyframes icon-pulse-anim {
    0% { transform: scale(1); opacity: 0.8; }
    50% { transform: scale(1.08); opacity: 1; }
    100% { transform: scale(1); opacity: 0.8; }
}
</style>
